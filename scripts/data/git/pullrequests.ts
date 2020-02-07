import {
    ClosePullRequestContribution,
    CreatePullRequestContribution,
    ReviewPullRequestContribution,
    IContributionProvider,
    ContributionName,
    UserContribution,
} from "../contracts";
import { repositoriesVal } from "./repositories";
import { GitPullRequestSearchCriteria, PullRequestStatus, GitPullRequest, GitRepository } from "TFS/VersionControl/Contracts";
import { getClient } from "TFS/VersionControl/GitRestClient";
import { yearStart } from "../dates";
import { IIndividualContributionFilter } from "../../filter";

export const createdPrs: {
    [username: string]: {
        [repoId: string]: Promise<GitPullRequest[]>
    }
} = {};

export const reviewedPrs: {
    [username: string]: {
        [repoId: string]: Promise<GitPullRequest[]>
    }
} = {};

function toRepoMap(repos: GitRepository[]): { [id: string]: GitRepository } {
    const map = {};
    for (const repo of repos) {
        map[repo.id] = repo;
    }
    return map;
}
const batchSize = 101;
function getPullRequestsForRepository(repoId: string, searchCriteria: GitPullRequestSearchCriteria, skip = 0): Promise<GitPullRequest[]> {
    return Promise.all([
        getClient().getPullRequests(repoId, searchCriteria, undefined, 0, skip, batchSize),
        repositoriesVal.getValue()
    ]).then(([pullrequests, repositories]) => {
        const repoMap = toRepoMap(repositories);
        pullrequests = pullrequests.filter(pr => pr.creationDate >= yearStart);
        for (const pr of pullrequests) {
            // backcompat with older tfs versions that do not have the project included in the repo reference
            pr.repository = repoMap[pr.repository.id];
        }
        if (pullrequests.length < batchSize) {
            return pullrequests;
        }
        return getPullRequestsForRepository(repoId, searchCriteria, skip + batchSize).then(morePullrequests =>
            [...pullrequests, ...morePullrequests]);

    });
}

// Old code for getting all repositories when the repo is not specified - this is inconsistent with the current behavior for commits

// async function getPullRequestsForProject(username: string, project: string, skip = 0): Promise<GitPullRequest[]> {
//     const criteria = {
//         creatorId: username,
//         status: PullRequestStatus.All,
//     } as GitPullRequestSearchCriteria;
//     let [pullrequests, repositories] = await Promise.all([
//         getClient().getPullRequestsByProject(project, criteria, undefined, skip, batchSize),
//         repositoriesVal.getValue()
//     ]);
//     const repoMap = toRepoMap(repositories);
//     pullrequests = pullrequests.filter(pr => pr.creationDate >= yearStart);
//     for (const pr of pullrequests) {
//         // backcompat with older tfs versions that do not have the project included in the repo reference
//         pr.repository = repoMap[pr.repository.id];
//     }
//     if (pullrequests.length < batchSize) {
//         return pullrequests;
//     }
//     return getPullRequestsForProject(username, project, skip + batchSize).then(morePullrequests =>
//         [...pullrequests, ...morePullrequests]);
// }

export async function getCreatedPullRequests(filter: IIndividualContributionFilter): Promise<GitPullRequest[]> {
    if (!filter.identity.id) return []; // requires userId to be able to do lookup
    
    if (!(filter.identity.id in createdPrs)) {
        createdPrs[filter.identity.id] = {};
    }

    const prProms: Promise<GitPullRequest[]>[] = [];
    const searchCriteria = {
        creatorId: filter.identity.id,
        status: PullRequestStatus.All
    } as GitPullRequestSearchCriteria;
    for (const { key: repoId } of filter.repositories) {
        if (!(repoId in createdPrs[filter.identity.id])) {
            createdPrs[filter.identity.id][repoId] = getPullRequestsForRepository(repoId, searchCriteria);
        }
        prProms.push(createdPrs[filter.identity.id][repoId]);
    }
    const pullrequestsArr = await Promise.all(prProms);
    const pullrequests: GitPullRequest[] = [];
    for (const arr of pullrequestsArr) {
        pullrequests.push(...arr);
    }
    return pullrequests;
}

export async function getReviewedPullRequests(filter: IIndividualContributionFilter): Promise<GitPullRequest[]> {
    if (!filter.identity.id) return []; // requires userId to be able to do lookup
    
    if (!(filter.identity.id in reviewedPrs)) {
        reviewedPrs[filter.identity.id] = {};
    }

    const prProms: Promise<GitPullRequest[]>[] = [];
    const searchCriteria = {
        reviewerId: filter.identity.id,
        status: PullRequestStatus.All,
    } as GitPullRequestSearchCriteria;
    for (const { key: repoId } of filter.repositories) {
        if (!(repoId in reviewedPrs[filter.identity.id])) {
            reviewedPrs[filter.identity.id][repoId] = getPullRequestsForRepository(repoId, searchCriteria);
        }
        prProms.push(reviewedPrs[filter.identity.id][repoId]);
    }
    const pullrequestsArr = await Promise.all(prProms);
    const pullrequests: GitPullRequest[] = [];
    for (const arr of pullrequestsArr) {
        pullrequests.push(...arr);
    }
    return pullrequests;
}

export class CreatePullRequestProvider implements IContributionProvider {
    public readonly name: ContributionName = "CreatePullRequest";
    public getContributions(filter: IIndividualContributionFilter): Promise<UserContribution[]> {
        return getCreatedPullRequests(filter).then(pullrequests =>
            pullrequests
                .filter(pr => pr.creationDate)
                .map(pr => new CreatePullRequestContribution(pr)));
    }
}
export class ClosePullRequestProvider implements IContributionProvider {
    public readonly name: ContributionName = "ClosePullRequest";
    public getContributions(filter: IIndividualContributionFilter): Promise<UserContribution[]> {
        return getCreatedPullRequests(filter).then(pullrequests =>
            pullrequests
                .filter(pr => pr.closedDate)
                .map(pr => new ClosePullRequestContribution(pr)));
    }
}

export class ReviewPullRequestProvider implements IContributionProvider {
    public readonly name: ContributionName = "ReviewPullRequest";
    public getContributions(filter: IIndividualContributionFilter): Promise<UserContribution[]> {
        return getReviewedPullRequests(filter).then(pullrequests =>
            pullrequests
                .filter(pr => pr.closedDate)
                .map(pr => new ReviewPullRequestContribution(pr)));
    }
}
