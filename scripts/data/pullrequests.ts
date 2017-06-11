import {
    IContributionFilter,
    ClosePullRequestContribution,
    CreatePullRequestContribution,
    IContributionProvider,
    ContributionName,
    UserContribution,
} from "./contracts";
import { repositories } from "./repositories";
import { GitPullRequestSearchCriteria, PullRequestStatus, GitPullRequest } from "TFS/VersionControl/Contracts";
import { getClient } from "TFS/VersionControl/GitRestClient";
import * as Q from "q";
import { CachedValue } from "./CachedValue";

export const createdPrs: {
    [username: string]: {
        [repoId: string]: CachedValue<any[]>
    }
} = {};

function getPullRequestsForRepository(username: string, repoId: string, skip = 0): Q.IPromise<GitPullRequest[]> {
    const criteria = {
        creatorId: username,
        repositoryId: repoId,
        status: PullRequestStatus.All,
    } as GitPullRequestSearchCriteria;
    return getClient().getPullRequests(repoId, criteria, undefined, undefined, skip, 100).then(pullrequests => {
        if (pullrequests.length < 100) {
            return pullrequests;
        }
        return getPullRequestsForRepository(username, repoId, skip + 100).then(morePullreqeusts => [...pullrequests, ...morePullreqeusts]);
    });
}

export function getPullRequests(filter: IContributionFilter): Q.IPromise<GitPullRequest[]> {
    return repositories.getValue().then(repositories => {
        const projId = VSS.getWebContext().project.id;
        if (!filter.allProjects) {
            repositories = repositories.filter(r => r.project.id === projId);
        }
        return Q.all(repositories.map(r => {
            const username = filter.username;
            const repoId = r.id;
            if (!(username in createdPrs)) {
                createdPrs[username] = {};
            }
            if (!(repoId in createdPrs[username])) {
                createdPrs[username][repoId] = new CachedValue(() => getPullRequestsForRepository(username, repoId));
            }
            return createdPrs[username][repoId].getValue();
        })).then(pullrequestsArr => {
            const pullrequests: GitPullRequest[] = [];
            for (const arr of pullrequestsArr) {
                pullrequests.push(...arr);
            }
            return pullrequests;
        });
    })
}

export class CreatePullRequestProvider implements IContributionProvider {
    public readonly name: ContributionName = "CreatePullRequest";
    public getContributions(filter: IContributionFilter): Q.IPromise<UserContribution[]> {
        return getPullRequests(filter).then(pullrequests =>
            pullrequests
                .filter(pr => pr.creationDate)
                .map(pr => new CreatePullRequestContribution(pr)));
    }
}
export class ClosePullRequestProvider implements IContributionProvider {
    public readonly name: ContributionName = "ClosePullRequest";
    public getContributions(filter: IContributionFilter): Q.IPromise<UserContribution[]> {
        return getPullRequests(filter).then(pullrequests =>
            pullrequests
                .filter(pr => pr.closedDate)
                .map(pr => new ClosePullRequestContribution(pr)));
    }
}
