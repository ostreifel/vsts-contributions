import * as React from "react";

import { IUserContributions } from "../data/contracts";
import { Graph } from "./Graph";

export class Graphs extends React.Component<{
    contributions: IUserContributions[],
    loading: boolean,
    sharedScale: boolean
}, {}> {
    public render() {
        let overrideLargest = 0;
        if (this.props.sharedScale) {
            let largests = this.props.contributions.map((contributions) => {
                const counts: number[] = Object.keys(contributions.data).map(day => contributions.data[day].length);
                counts.sort((a, b) => a - b);
                return counts.length ?  counts[counts.length - 1] : 0;
            });
            largests.sort((a, b) => a - b);
            overrideLargest = largests[largests.length - 1];
        }
        return <div className="graphs">
            {this.props.contributions.map((contributions) => <Graph
                contributions={contributions}
                loading={this.props.loading}
                overrideLargest={overrideLargest}
            />)}
        </div>;
    }
}
