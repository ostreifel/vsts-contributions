import * as Q from "q";
import { IContribution } from "./contracts";
import { commits } from "./commits";
import { yearStart, yearEnd } from "./dates";

export function getContributions(user?: string, start?: Date, end?: Date): Q.IPromise<IContribution[]> {
    if (!start) {
        start = yearStart;
        end = yearEnd;
    } else if (!end) {
        end = new Date(start);
        end.setDate(end.getDate() + 1);
    }

    return Q.all([commits.getValue()]).then(([commits]) => {
        const contributions: IContribution[] = [];
        contributions.push(...commits);
        contributions.sort((a, b) =>
            a.date.getTime() - b.date.getTime()
        )
        return contributions;
    });
}
