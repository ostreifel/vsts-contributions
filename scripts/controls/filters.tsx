import * as React from "react";
import * as ReactDOM from "react-dom";
import { IContributionFilter } from "../data/contracts";
import { CollapsibleHeader } from "./CollapsibleHeader";
import { Toggle } from "OfficeFabric/components/toggle";
import { IdentityPicker } from "./IdentityPicker";
import { defaultFilter } from "../defaultFilter";

let filters: Filters;
class Filters extends React.Component<
  {
    onChanged: (filter: IContributionFilter) => void;
    initialFilter?: IContributionFilter;
  },
  IContributionFilter
> {
  constructor() {
    super();
    this.state = defaultFilter;
    filters = this;
  }
  render() {
    return (
      <div>
        <IdentityPicker
          identity={this.state.identity}
          onIdentityChanged={identity => {
            this.setState({ ...this.state, identity });
          }}
          width={400}
        />
        <CollapsibleHeader
          title="Activity Filters"
          name="Filters"
          className="filter-header"
        >
          <div className="filters">
            <Toggle defaultChecked={this.state.allProjects} label={"All projects"} onChanged={checked => {
                this.setState({ ...this.state, allProjects: checked });
            }} />
            <Toggle defaultChecked={this.state.enabledProviders.Commit} label={"Commits"} onChanged={checked => {
                this.setState({ ...this.state, enabledProviders: { ...this.state.enabledProviders, Commit: checked } });
            }} />
            <Toggle defaultChecked={this.state.enabledProviders.CreatePullRequest} label={"Created pull requests"} onChanged={checked => {
                this.setState({ ...this.state, enabledProviders: { ...this.state.enabledProviders, CreatePullRequest: checked } });
            }} />
            <Toggle defaultChecked={this.state.enabledProviders.ClosePullRequest} label={"Closed pull requests"} onChanged={checked => {
                this.setState({ ...this.state, enabledProviders: { ...this.state.enabledProviders, ClosePullRequest: checked } });
            }} />
            <Toggle defaultChecked={this.state.enabledProviders.ClosePullRequest} label={"Created work items"} onChanged={checked => {
                this.setState({ ...this.state, enabledProviders: { ...this.state.enabledProviders, CreateWorkItem: checked } });
            }} />
            <Toggle defaultChecked={this.state.enabledProviders.ClosePullRequest} label={"Resolved work items"} onChanged={checked => {
                this.setState({ ...this.state, enabledProviders: { ...this.state.enabledProviders, ResolveWorkItem: checked } });
            }} />
            <Toggle defaultChecked={this.state.enabledProviders.ClosePullRequest} label={"Closed work items"} onChanged={checked => {
                this.setState({ ...this.state, enabledProviders: { ...this.state.enabledProviders, CloseWorkItem: checked } });
            }} />
          </div>
        </CollapsibleHeader>
      </div>
    );
  }
  componentWillMount() {
    if (this.props.initialFilter) {
        this.setState(this.props.initialFilter);
    }
  }
  componentDidMount() {
    this.props.onChanged(this.state);
  }
  componentDidUpdate() {
    this.props.onChanged(this.state);
  }
}

export function updateSelectedDate(date?: Date) {
  const state: IContributionFilter = { ...filters.state, selectedDate: date };
  filters.setState(state);
}
export function getState() {
  return filters.state;
}

export function renderFilters(
  onChanged: (filter: IContributionFilter) => void,
  initialFilter: IContributionFilter = defaultFilter
) {
  const graphParent = $(".filter-container")[0];
  ReactDOM.render(
    <Filters onChanged={onChanged} initialFilter={initialFilter} />,
    graphParent
  );
}
