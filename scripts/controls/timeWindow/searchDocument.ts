import {
    UserContribution,
    CommitContribution,
    WorkItemContribution,
    PullRequestContribution,
    ChangesetContribution,
} from "../../data/contracts";

export interface IContributionDocument {
    contribution: UserContribution;
    title: string;
    // location: string;
}

export function toDocument(contribution: UserContribution): IContributionDocument {
    if (contribution instanceof CommitContribution) {
        const commit = contribution.commit;
        return {
            title: commit.comment,
            contribution,
        }
    } else if (contribution instanceof WorkItemContribution) {
        const wi = contribution.wi;
        return {
            title: wi.fields["System.Title"],
            contribution,
        }
    } else if (contribution instanceof PullRequestContribution) {
        const pr = contribution.pullrequest;
        return {
            title: pr.title,
            contribution,
        }
    } else if (contribution instanceof ChangesetContribution) {
        const changeset = contribution.changeset;
        return {
            title: changeset.comment,
            contribution,
        }
    }
    throw new Error("Unknown contributionType " + contribution);
}

