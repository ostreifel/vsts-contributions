import * as React from "react";

import { IUserContributions } from "../data/contracts";
import { Graph } from "./Graph";

export class Graphs extends React.Component<{
    contributions: IUserContributions[],
    loading: boolean,
}, {}> {
    public render() {
        return <div className="graphs">
            {this.props.contributions.map((contributions) => <Graph
                contributions={contributions}
                loading={this.props.loading}
            />)}
        </div>;
    }
}
