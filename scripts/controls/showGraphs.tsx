import * as React from "react";
import * as ReactDOM from "react-dom";
import { DelayedFunction } from "VSS/Utils/Core";

import { IUserContributions } from "../data/contracts";
import { getContributions } from "../data/provider";
import { trackEvent } from "../events";
import { filterToIProperties, IContributionFilter } from "../filter";
import { Timings } from "../timings";
import { Graphs } from "./Graphs";


export type TileSize = "small-tiles" | "medium-tiles";

let renderNum = 0;
export function renderGraphs(filter: IContributionFilter, tileSize: TileSize = "medium-tiles") {
    const graphParent = $(".graphs-container")[0];
    const timings = new Timings();
    const currentRender = ++renderNum;
    /** Don't show the spinner all the time -- rendering the graph takes about 300 ms */
    const showSpinner = new DelayedFunction(null, 400, "showSpinner", () => {
        if (currentRender === renderNum) {
            const loadingContributions = filter.identities.map((user): IUserContributions => ({key: -1, data: {}, user}));
            ReactDOM.render(<Graphs
                contributions={loadingContributions}
                loading={true}
                className={tileSize}
            />, graphParent,
            () => {
                timings.measure("drawSpinner");
            });
        }
    });
    showSpinner.start();
    getContributions(filter).then(contributions => {
        showSpinner.cancel();
        if (currentRender === renderNum) {
            timings.measure("getContributions");
            ReactDOM.render(<Graphs
                contributions={contributions}
                loading={false}
                className={tileSize}
            />, graphParent, () => {
                timings.measure("drawGraph");
                trackEvent("loadGraph", filterToIProperties(filter), timings.measurements);
            });
        }
    });
}
