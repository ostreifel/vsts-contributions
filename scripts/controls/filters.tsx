import * as React from "react";
import * as ReactDOM from "react-dom";
import { renderGraph } from "./graph";
import { renderTimeWindow } from "./timeWindow";
import { IContributionFilter } from "../data/contracts";

let filters: Filters;
class Filters extends React.Component<{}, IContributionFilter> {
    constructor() {
        super();
        this.state = {
            username: VSS.getWebContext().user.name,
            allProjects: false,
        };
        filters = this;
    }
    render() {
        return <div/>;
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
    const state: IContributionFilter = {...filters.state, selectedDate: date};
    filters.setState(state)
}
export function getState() {
    return filters.state;
}


export function renderFilters() {
    const graphParent = $(".graph-filters")[0];
    ReactDOM.render(<Filters />, graphParent);
}
