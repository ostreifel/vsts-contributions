import * as React from "react";
import * as ReactDOM from "react-dom";
import { renderGraph } from "./graph";
import { renderTimeWindow } from "./timeWindow";
import { IContributionFilter } from "../data/contracts";
import { CollapsibleHeader } from "./header";
import { Toggle } from "OfficeFabric/components/toggle"

let filters: Filters;
class Filters extends React.Component<{}, IContributionFilter> {
    constructor() {
        super();
        this.state = {
            username: VSS.getWebContext().user.name,
            allProjects: false,
            enabledProviders: {
                Commit: true,
                CreatePullRequest: true,
                ClosePullRequest: true,
            }
        };
        filters = this;
    }
    render() {
        return <CollapsibleHeader title="Activity Filters" name="Filters" className="filter-header">
            <div className="filters">
                <Toggle defaultChecked={this.state.allProjects} label={"All projects"} onChanged={checked => {
                    this.setState({ ...this.state, allProjects: checked });
                }} />
                <Toggle defaultChecked={this.state.enabledProviders.Commit} label={"Show commits"} onChanged={checked => {
                    this.setState({ ...this.state, enabledProviders: { ...this.state.enabledProviders, Commit: checked } });
                }} />
                <Toggle defaultChecked={this.state.enabledProviders.CreatePullRequest} label={"Show created pull requests"} onChanged={checked => {
                    this.setState({ ...this.state, enabledProviders: { ...this.state.enabledProviders, CreatePullRequest: checked } });
                }} />
                <Toggle defaultChecked={this.state.enabledProviders.ClosePullRequest} label={"Show closed pull requests"} onChanged={checked => {
                    this.setState({ ...this.state, enabledProviders: { ...this.state.enabledProviders, ClosePullRequest: checked } });
                }} />
            </div>
        </CollapsibleHeader>;
    }
    updateComponents(filter: IContributionFilter) {
        renderGraph(filter);
        renderTimeWindow(filter);
    }
    componentDidMount() {
        this.updateComponents(this.state);
    }
    componentDidUpdate() {
        this.updateComponents(this.state);
    }
}

export function updateSelectedDate(date?: Date) {
    const state: IContributionFilter = { ...filters.state, selectedDate: date };
    filters.setState(state)
}
export function getState() {
    return filters.state;
}


export function renderFilters() {
    const graphParent = $(".filter-container")[0];
    ReactDOM.render(<Filters />, graphParent);
}
