import * as React from "react";

import { IUserContributions } from "../data/contracts";
import { ISelectedRange } from "../filter";
import { Graph } from "./graph";
import { ToggleSelected } from "./showGraphs";

export class Graphs extends React.Component<{
    selected?: ISelectedRange,
    contributions: IUserContributions[],
    loading: boolean,
    className?: string,
    toggleSelect: ToggleSelected
}, {}> {
    public render() {
        return <div className="graphs">
            {this.props.contributions.map((contributions) => <Graph
                selected={this.selected(contributions.user.uniqueName)}
                contributions={contributions}
                loading={this.props.loading}
                className={this.props.className}
                toggleSelect={this.props.toggleSelect}
            />)}
        </div>;
    }
    private selected(identity: string): ISelectedRange | undefined {
        if (!this.props.selected || this.props.selected.identity !== identity) {
            return undefined;
        }
        return this.props.selected;
    }

}
