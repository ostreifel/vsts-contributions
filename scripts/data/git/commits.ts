import { GitCommitRef } from "TFS/VersionControl/Contracts";
import * as Q from "q";
import { repositoriesVal } from "./repositories";
import { yearStart } from "../dates";
import {
    CommitContribution,
    IContributionProvider,
    ContributionName,
} from "../contracts";
import { callApi } from "../RestCall";
import { IIndividualContributionFilter } from "../../filter";


const commits: {
    [userName: string]: {
        [repositoryId: string]: Promise<CommitContribution[]>
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

const batchSize = 2000;
async function commitsForRepository(username: string, repoId: string, skip = 0): Promise<GitCommitRef[]> {
    return getCommits(repoId, yearStart, skip, batchSize, username).then(commits => {
        if (commits.length < batchSize) {
            return commits.filter((c) => !c.comment.match(/Merged PR \d+/));
        } else {
            return commitsForRepository(username, repoId, skip + batchSize).then(moreCommits => [...commits, ...moreCommits]);
        }
    });
}

export class CommitContributionProvider implements IContributionProvider {
    public readonly name: ContributionName = "Commit";
    public async getContributions(filter: IIndividualContributionFilter): Promise<CommitContribution[]> {
        const { identity, allProjects } = filter;
        const username = identity.uniqueName || identity.displayName;
        let repositories = await repositoriesVal.getValue();
        const currentProject = VSS.getWebContext().project.id;
        if (!allProjects) {
            repositories = repositories.filter(r => r.project.id === currentProject);
        }

        const repoKeys: {[key: string]: undefined} = {};
        for (const {key} of filter.repositories) {
            repoKeys[key] = undefined;
        }
        repositories = repositories.filter(r => r.id in repoKeys);
        const commitsArr: CommitContribution[][] = await Promise.all(
            repositories.map((r): Promise<CommitContribution[]> => {
                if (!(username in commits)) {
                    commits[username] = {};
                }
                if (!(r.id in commits[username])) {
                    commits[username][r.id] = commitsForRepository(username, r.id).then(commits =>
                        commits.map(c => (new CommitContribution(r, c))
                        )
                    );
            }
                return commits[username][r.id];
            })
        );
        const commitsContributions: CommitContribution[] = [];
        for (const arr of commitsArr) {
            commitsContributions.push(...arr);
        }
        return commitsContributions;
    }
}
