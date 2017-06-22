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
        [projectIdOrRepoId: string]: CachedValue<GitPullRequest[]>
    }
} = {};

function toRepoMap(repos: GitRepository[]): {[id: string]: GitRepository} {
    const map = {};
    for (const repo of repos) {
        map[repo.id] = repo;
    }
    return map;
}
function getPullRequestsForRepository(username: string, repoId: string, skip = 0): Q.IPromise<GitPullRequest[]> {
    const criteria = {
        creatorId: username,
        status: PullRequestStatus.All,
    } as GitPullRequestSearchCriteria;
    return Q.all([
        getClient().getPullRequests(repoId, criteria, undefined, 0, skip, 100),
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
        return getPullRequestsForRepository(username, repoId, skip + 100).then(morePullrequests =>
            [...pullrequests, ...morePullrequests]);

    });
}

function getPullRequestsForProject(username: string, project: string, skip = 0): Q.IPromise<GitPullRequest[]> {
    const criteria = {
        creatorId: username,
        status: PullRequestStatus.All,
    } as GitPullRequestSearchCriteria;
    return Q.all([
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
    const currentProject = VSS.getWebContext().project.id;
    const targetProjects = Q.all([
        projects.getValue(),
        repositories.getValue()
    ]).then(([
        projects,
        repositories
    ]) => {
        return projects
            .filter(p =>
                (filter.allProjects || currentProject === p.id) &&
                (!filter.repository || repositories.some(r => !!filter.repository && r.id === filter.repository.key))
            )
            .map(p => p.id);
    });
    return targetProjects.then(projects => {
        const username = filter.identity.id;
        return Q.all(projects.map(proj => {
            if (!(username in createdPrs)) {
                createdPrs[username] = {};
            }
            if (filter.repository) {
                const repoId = filter.repository.key;
                if (!(repoId in createdPrs[username])) {
                    createdPrs[username][repoId] = new CachedValue(() => getPullRequestsForRepository(username, repoId));
                }
                return createdPrs[username][repoId].getValue();
            } else {
                if (!(proj in createdPrs[username])) {
                    createdPrs[username][proj] = new CachedValue(() => getPullRequestsForProject(username, proj));
                }
                return createdPrs[username][proj].getValue();
            }
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
