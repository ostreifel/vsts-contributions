import { } from "TFS/VersionControl/Contracts";
import { GitQueryCommitsCriteria, GitCommitRef, GitRepository } from "TFS/VersionControl/Contracts";
import { getClient } from "TFS/VersionControl/GitRestClient";
import * as Q from "q";
import { CachedValue } from "./CachedValue";
import { repositories } from "./repositories";
import { yearStart } from "./dates";
import { IContribution } from "./contracts";

export const commits = new CachedValue(getAllCommits);

function commitsForReprository(repoId: string, skip = 0): Q.IPromise<GitCommitRef[]> {
    const criteria: Partial<GitQueryCommitsCriteria> = {
        fromDate: yearStart.toString(),
        $skip: skip,
        $top: 100,
        author: VSS.getWebContext().user.id,
    };
    return getClient().getCommits(repoId, criteria as GitQueryCommitsCriteria).then(commits => {
        if (commits.length < 100) {
            return commits;
        } else {
            return commitsForReprository(repoId, skip + 100).then(moreCommits => [...commits, ...moreCommits]);
        }
    })
}

export class RepoCommit implements IContribution {
    public readonly date: Date;
    constructor(readonly repo: GitRepository, readonly commit: GitCommitRef) {
        this.date = commit.author.date;
    }
}

function getAllCommits() {
    return repositories.getValue().then(repositories =>
        Q.all(
            repositories.map(r =>
                commitsForReprository(r.id).then(commits =>
                    commits.map(c => (new RepoCommit(r, c))
                    )
                )
            )
        ).then((commitsArr) => {
            const commits: RepoCommit[] = [];
            for (const arr of commitsArr) {
                commits.push(...arr);
            }
            return commits;
        })
    );
}
