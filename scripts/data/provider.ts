import * as Q from "q";
import { UserContribution, IUserContributions } from "./contracts";
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

export function getContributions(
    username: string = VSS.getWebContext().user.name,
    allProjects: boolean = false
): Q.IPromise<IUserContributions> {
    return Q.all([getCommits(username, allProjects)]).then(([commits]) => {
        const contributions: IUserContributions = {};
        addContributions(commits, contributions);
        sortContributions(contributions);
        return contributions;
    });
}
