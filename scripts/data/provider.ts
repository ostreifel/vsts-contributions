import * as Q from "q";
import { UserContribution, IUserContributions, IContributionFilter } from "./contracts";
import { getCommits } from "./commits";
import { yearStart, yearEnd } from "./dates";

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
    return Q.all([getCommits(filter)]).then(([commits]) => {
        const contributions: IUserContributions = {};
        addContributions(commits, contributions);
        sortContributions(contributions);
        return contributions;
    });
}
