import { GitCommitRef, GitPullRequest, GitRepository, TfvcChangesetRef } from "TFS/VersionControl/Contracts";
import { WorkItem } from "TFS/WorkItemTracking/Contracts";

import { IIdentity } from "../controls/IdentityPicker";
import { IEnabledProviders, IIndividualContributionFilter } from "../filter";

export type ContributionName = keyof IEnabledProviders;

export interface IContributionProvider {
    readonly name: ContributionName;
    getContributions(filter: IIndividualContributionFilter): PromiseLike<UserContribution[]>;
}

export interface IUserContributions {
    /** unique identifier for quickly checking if 2 IUserContributions are the same */
    key: number;
    user: IIdentity;
    data: {
        [day: number]: UserContribution[];
    };
}

export class UserContribution {
    readonly day: Date;
    readonly date: Date;
    constructor(readonly id: string, date: Date | string) {
        this.date = date instanceof Date ? date : new Date(date);
        this.day = new Date(this.date.getTime());
        this.day.setHours(0, 0, 0, 0);
    }
}

export class CommitContribution extends UserContribution {
    constructor(readonly repo: GitRepository, readonly commit: GitCommitRef) {
        super(`commit-${commit.commitId}`, commit.author.date);
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
