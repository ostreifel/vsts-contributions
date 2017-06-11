import { GitCommitRef, GitRepository, GitPullRequest } from "TFS/VersionControl/Contracts";

export type ContributionName = keyof IEnabledProviders;

export interface IContributionProvider {
    readonly name: ContributionName;
    getContributions(filter: IContributionFilter): Q.IPromise<UserContribution[]>;
}

export interface IEnabledProviders {
    Commit: boolean;
    CreatePullRequest: boolean;
    ClosePullRequest: boolean;
}

export interface IContributionFilter {
    username: string;
    allProjects: boolean;
    selectedDate?: Date;
    enabledProviders: IEnabledProviders;
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

export class CommitContribution extends UserContribution {
    constructor(readonly repo: GitRepository, readonly commit: GitCommitRef) {
        super(commit.author.date);
    }
}

export abstract class PullRequestContribution extends UserContribution {
    constructor(readonly pullrequest: GitPullRequest, date: Date) {
        super(date);
    }
}

export class CreatePullRequestContribution extends PullRequestContribution {
    constructor(pullrequest: GitPullRequest) {
        super(pullrequest, pullrequest.creationDate);
    }
}
export class ClosePullRequestContribution extends PullRequestContribution {
    constructor(pullrequest: GitPullRequest) {
        super(pullrequest, pullrequest.closedDate);
    }
}

export abstract class WorkItemContribution extends UserContribution {
    constructor(readonly wi: any, date: Date) {
        super(date);
    }
}
