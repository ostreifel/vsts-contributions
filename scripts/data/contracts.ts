import { GitQueryCommitsCriteria, GitCommitRef, GitRepository } from "TFS/VersionControl/Contracts";


export interface IContributionFilter {
    username: string;
    allProjects: boolean;
    selectedDate?: Date;
}

export interface IUserContributions {
    [day: number]: UserContribution[];
}

export class UserContribution {
    readonly day: Date;
    constructor(readonly date: Date) {
        this.day = new Date(date);
        this.day.setHours(0, 0, 0, 0);
    }
}

export class RepoCommit extends UserContribution {
    constructor(readonly repo: GitRepository, readonly commit: GitCommitRef) {
        super(commit.author.date);
    }
}