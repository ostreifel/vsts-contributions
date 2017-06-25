import { GitCommitRef, GitRepository, GitPullRequest } from "TFS/VersionControl/Contracts";
import { WorkItem } from "TFS/WorkItemTracking/Contracts";
import { TfvcChangesetRef } from "TFS/VersionControl/Contracts";
import { IContributionFilter, IEnabledProviders } from "../filter";

export type ContributionName = keyof IEnabledProviders;

export interface IContributionProvider {
    readonly name: ContributionName;
    getContributions(filter: IContributionFilter): Q.IPromise<UserContribution[]>;
}

export interface IUserContributions {
    [day: number]: UserContribution[];
}

export class UserContribution {
    readonly day: Date;
    constructor(readonly id: string, readonly date: Date) {
        this.day = new Date(date);
        this.day.setHours(0, 0, 0, 0);
    }
}

export class CommitContribution extends UserContribution {
    constructor(readonly repo: GitRepository, readonly commit: GitCommitRef) {
        super(`commit-${commit.commitId}`, new Date(commit.author.date));
    }
}

export abstract class PullRequestContribution extends UserContribution {
    constructor(id: string, date: Date, readonly pullrequest: GitPullRequest) {
        super(id, date);
    }
}

export class CreatePullRequestContribution extends PullRequestContribution {
    constructor(pullrequest: GitPullRequest) {
        super(`pr-create-${pullrequest.pullRequestId}`, pullrequest.creationDate, pullrequest);
    }
}
export class ClosePullRequestContribution extends PullRequestContribution {
    constructor(pullrequest: GitPullRequest) {
        super(`pr-close-${pullrequest.pullRequestId}`, pullrequest.closedDate, pullrequest);
    }
}

export abstract class WorkItemContribution extends UserContribution {
    constructor(id: string, dateStr: string, readonly wi: WorkItem) {
        super(id, new Date(dateStr));
    }
}

export class CreateWorkItemContribution extends WorkItemContribution {
    constructor(wi: WorkItem) {
        super(`create-wi-${wi.id}`, wi.fields["System.CreatedDate"], wi);
    }
}

export class ResolveWorkItemContribution extends WorkItemContribution {
    constructor(wi: WorkItem) {
        super(`resolve-wi-${wi.id}`, wi.fields["Microsoft.VSTS.Common.ResolvedDate"], wi);
    }
}

export class CloseWorkItemContribution extends WorkItemContribution {
    constructor(wi: WorkItem) {
        super(`close-wi-${wi.id}`, wi.fields["Microsoft.VSTS.Common.ClosedDate"], wi);
    }
}

export class ChangesetContribution extends UserContribution {
    constructor(readonly changeset: TfvcChangesetRef, readonly projectName: string) {
        super(`changeset-${changeset.changesetId}`, changeset.createdDate);
    }
}
