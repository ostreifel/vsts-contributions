import * as Q from "q";
import { UserContribution, IUserContributions } from "./contracts";
import { commits } from "./commits";
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

export function getContributions(user?: string, start?: Date, end?: Date): Q.IPromise<IUserContributions> {
    if (!start) {
        start = yearStart;
        end = yearEnd;
    } else if (!end) {
        end = new Date(start);
        end.setDate(end.getDate() + 1);
    }

    return Q.all([commits.getValue()]).then(([commits]) => {
        const contributions: IUserContributions = {};
        addContributions(commits, contributions);
        sortContributions(contributions);
        return contributions;
    });
}
