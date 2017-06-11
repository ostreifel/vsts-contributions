import * as Q from "q";
import { UserContribution, IUserContributions, IContributionFilter } from "./contracts";
import { getCommitContributions } from "./commits";
import { getPullRequestContributions } from "./pullrequests";

function addContributions(arr: UserContribution[], contributions: IUserContributions) {
    for (const contribution of arr) {
        const day = contribution.day.getTime();
        if (!(day in contributions)) {
            contributions[day] = [];
        }
        contributions[day].push(contribution);
    }
}
function sortContributions(contributions: IUserContributions) {
    for (const day in contributions) {
        contributions[day].sort((a, b) =>
            a.date.getTime() - b.date.getTime()
        );
    }
}

export function getContributions(filter: IContributionFilter): Q.IPromise<IUserContributions> {
    return Q.all([
        getCommitContributions(filter),
        getPullRequestContributions(filter)
    ]).then((contributionsArr) => {
        const contributions: IUserContributions = {};
        for (const arr of contributionsArr) {
            addContributions(arr, contributions);
        }
        sortContributions(contributions);
        return contributions;
    });
}
