import {
    ClosePullRequestContribution,
    CreatePullRequestContribution,
    IContributionProvider,
    ContributionName,
    UserContribution,
} from "../contracts";
import { repositories } from "./repositories";
import { GitPullRequestSearchCriteria, PullRequestStatus, GitPullRequest, GitRepository } from "TFS/VersionControl/Contracts";
import { getClient } from "TFS/VersionControl/GitRestClient";
import * as Q from "q";
import { CachedValue } from "../CachedValue";
import { IContributionFilter } from "../../filter";
import { projects } from "../projects"

export const createdPrs: {
    [username: string]: {
        [project: string]: CachedValue<GitPullRequest[]>
    }
} = {};

function toRepoMap(repos: GitRepository[]): {[id: string]: GitRepository} {
    const map = {};
    for (const repo of repos) {
        map[repo.id] = repo;
    }
    return map;
}

function getPullRequestsForProject(username: string, project: string, skip = 0): Q.IPromise<GitPullRequest[]> {
    const criteria = {
        creatorId: username,
        status: PullRequestStatus.All,
    } as GitPullRequestSearchCriteria;
    return Q.all([
        // Get batches of 300 at a time to reduce the number of roundtrips
        getClient().getPullRequestsByProject(project, criteria, undefined, skip, 100),
        repositories.getValue()
    ]).then(([pullrequests, repositories]) => {
        const repoMap = toRepoMap(repositories);
        for (const pr of pullrequests) {
            // backcompat with older tfs versions that do not have the project included in the repo reference
            pr.repository = repoMap[pr.repository.id];
        }
        if (pullrequests.length < 100) {
            return pullrequests
        }
        return getPullRequestsForProject(username, project, skip + 100).then(morePullrequests =>
            [...pullrequests, ...morePullrequests]);

    });
}

export function getPullRequests(filter: IContributionFilter): Q.IPromise<GitPullRequest[]> {
    const targetProjects = filter.allProjects ?
        projects.getValue().then(projs => projs.map(p => p.name)) :
        Q([VSS.getWebContext().project.name]);
    return targetProjects.then(projects => {
        const username = filter.identity.id;
        return Q.all(projects.map(proj => {
            if (!(username in createdPrs)) {
                createdPrs[username] = {};
            }
            if (!(proj in createdPrs[username])) {
                createdPrs[username][proj] = new CachedValue(() => getPullRequestsForProject(username, proj));
            }
            return createdPrs[username][proj].getValue();
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
