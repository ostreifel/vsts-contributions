import * as React from "react";
import * as ReactDOM from "react-dom";
import { getContributions } from "../data/provider";
import { sliceContributions } from "./sliceContributions";
import { format } from "VSS/Utils/Date";

export function renderTimeWindow(date?: Date) {
    const graphParent = $(".time-window-container")[0];
    getContributions().then(contributions => {
        if (date) {
            const end = new Date(date);
            end.setDate(end.getDate() + 1);
            contributions = sliceContributions(contributions, date, end);
        }
        ReactDOM.render(<div>
            <h3>{date ? `On ${format(date, "yyyy-MM-dd")}` : "For the year"}</h3>
            <div>
                {`${contributions.length} contributions`}
            </div>
        </div>, graphParent);
    });
}
