import { } from "TFS/VersionControl/Contracts";
import { GitQueryCommitsCriteria, GitCommitRef, GitRepository } from "TFS/VersionControl/Contracts";
import { getClient } from "TFS/VersionControl/GitRestClient";
import { format } from "VSS/Utils/Date"
import * as Q from "q";
import { CachedValue } from "./CachedValue";
import { repositories } from "./repositories";
import { yearStart } from "./dates";
import { RepoCommit } from "./contracts";

const commits: {
    [userName: string]: {
        [repositoryId: string]: CachedValue<RepoCommit[]>
    }
} = {};

function commitsForReprository(username: string, repoId: string, skip = 0): Q.IPromise<GitCommitRef[]> {
    const criteria: Partial<GitQueryCommitsCriteria> = {
        fromDate: format(yearStart, "MM/dd/yyyy HH:mm:ss"),
        $skip: skip,
        $top: 100,
        author: username,
    };
    return getClient().getCommits(repoId, criteria as GitQueryCommitsCriteria).then(commits => {
        if (commits.length < 100) {
            return commits;
        } else {
            return commitsForReprository(username, repoId, skip + 100).then(moreCommits => [...commits, ...moreCommits]);
        }
    });
}

export function getCommits(username: string, allProjects: boolean) {
    return repositories.getValue().then(repositories => {
        const currentProject = VSS.getWebContext().project.id;
        if (!allProjects) {
            repositories = repositories.filter(r => r.project.id === currentProject);
        }
        return Q.all(
            repositories.map(r => {
                if (!(username in commits)) {
                    commits[username] = {};
                }
                if (!(r.id in commits[username])) {
                    commits[username][r.id] = new CachedValue(() => commitsForReprository(username, r.id).then(commits =>
                        commits.map(c => (new RepoCommit(r, c))
                        )
                    ));
                }
                return commits[username][r.id].getValue();
            })
        ).then((commitsArr) => {
            const commits: RepoCommit[] = [];
            for (const arr of commitsArr) {
                commits.push(...arr);
            }
            return commits;
        })
    }
    );
}
