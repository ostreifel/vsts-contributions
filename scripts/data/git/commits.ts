import { GitCommitRef } from "TFS/VersionControl/Contracts";
import * as Q from "q";
import { CachedValue } from "../CachedValue";
import { repositories } from "./repositories";
import { yearStart } from "../dates";
import {
    CommitContribution,
    IContributionProvider,
    ContributionName,
} from "../contracts";
import { callApi } from "../RestCall";
import { IContributionFilter } from "../../filter";


const commits: {
    [userName: string]: {
        [repositoryId: string]: CachedValue<CommitContribution[]>
    }
} = {};

function getCommits(repoId: string, fromDate: Date, skip: number, top: number, author: string): Q.IPromise<GitCommitRef[]> {
    const webContext = VSS.getWebContext();
    const commitsUrl = webContext.collection.uri +
        "_apis/git/repositories/" +
         repoId +
          "/Commits?api-version=1.0" +
          "&fromDate=" + encodeURIComponent(fromDate.toJSON()) +
          "&author=" + encodeURIComponent(author) +
          "&$skip=" + skip +
          "&$top=" + top;

    const defered = Q.defer<GitCommitRef[]>();
    callApi(commitsUrl, "GET", undefined, undefined, (commits) => defered.resolve(commits.value), (error) => defered.reject(error));
    return defered.promise;
}

function commitsForRepository(username: string, repoId: string, skip = 0): Q.IPromise<GitCommitRef[]> {
    return getCommits(repoId, yearStart, skip, 10000, username).then(commits => {
        if (commits.length < 10000) {
            return commits;
        } else {
            return commitsForRepository(username, repoId, skip + 10000).then(moreCommits => [...commits, ...moreCommits]);
        }
    });
}

export class CommitContributionProvider implements IContributionProvider {
    public readonly name: ContributionName = "Commit";
    public getContributions(filter: IContributionFilter) {
        const { identity, allProjects } = filter;
        const username = identity.uniqueName || identity.displayName;
        return repositories.getValue().then(repositories => {
            const currentProject = VSS.getWebContext().project.id;
            if (!allProjects) {
                repositories = repositories.filter(r => r.project.id === currentProject);
            }
            if (filter.repository) {
                const repoId = filter.repository.key;
                repositories = repositories.filter(r => r.id === repoId);
            }
            return Q.all(
                repositories.map(r => {
                    if (!(username in commits)) {
                        commits[username] = {};
                    }
                    if (!(r.id in commits[username])) {
                        commits[username][r.id] = new CachedValue(() => commitsForRepository(username, r.id).then(commits =>
                            commits.map(c => (new CommitContribution(r, c))
                            )
                        ));
                    }
                    return commits[username][r.id].getValue();
                })
            ).then((commitsArr) => {
                const commits: CommitContribution[] = [];
                for (const arr of commitsArr) {
                    commits.push(...arr);
                }
                return commits;
            })
        });
    }
}
