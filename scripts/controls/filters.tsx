import * as React from "react";
import * as ReactDOM from "react-dom";
import { CollapsibleHeader } from "./CollapsibleHeader";
import { Toggle } from "OfficeFabric/components/toggle";
import { IdentityPicker } from "./IdentityPicker";
import { defaultFilter, IContributionFilter } from "../filter";

interface IFiltersProps {
    onChanged: (filter: IContributionFilter) => void;
    filter: IContributionFilter;
    collapsible?: boolean;
}

let filters: Filters;
class Filters extends React.Component<
  IFiltersProps,{}
> {
  constructor() {
    super();
    filters = this;
  }
  render() {
    const { filter } = this.props;
    const collapsibleContent =
        <div className="filters">
            <Toggle checked={filter.allProjects} label={"All projects"} onChanged={checked => {
                this.updateFilter({ ...filter, allProjects: checked });
            }} />
            <Toggle checked={filter.enabledProviders.Commit} label={"Commits"} onChanged={checked => {
                this.updateFilter({ ...filter, enabledProviders: { ...filter.enabledProviders, Commit: checked } });
            }} />
            <Toggle checked={filter.enabledProviders.CreatePullRequest} label={"Created pull requests"} onChanged={checked => {
                this.updateFilter({ ...filter, enabledProviders: { ...filter.enabledProviders, CreatePullRequest: checked } });
            }} />
            <Toggle checked={filter.enabledProviders.ClosePullRequest} label={"Closed pull requests"} onChanged={checked => {
                this.updateFilter({ ...filter, enabledProviders: { ...filter.enabledProviders, ClosePullRequest: checked } });
            }} />
            <Toggle checked={filter.enabledProviders.CreateWorkItem} label={"Created work items"} onChanged={checked => {
                this.updateFilter({ ...filter, enabledProviders: { ...filter.enabledProviders, CreateWorkItem: checked } });
            }} />
            <Toggle checked={filter.enabledProviders.ResolveWorkItem} label={"Resolved work items"} onChanged={checked => {
                this.updateFilter({ ...filter, enabledProviders: { ...filter.enabledProviders, ResolveWorkItem: checked } });
            }} />
            <Toggle checked={filter.enabledProviders.CloseWorkItem} label={"Closed work items"} onChanged={checked => {
                this.updateFilter({ ...filter, enabledProviders: { ...filter.enabledProviders, CloseWorkItem: checked } });
            }} />
        </div>;
    return (
      <div>
        <IdentityPicker
          identity={filter.identity}
          onIdentityChanged={identity => {
            this.updateFilter({ ...filter, identity });
          }}
          forceValue={true}
          width={400}
        />
        {this.props.collapsible ?
          <CollapsibleHeader
            title="Activity Filters"
            name="Filters"
            className="filter-header"
          >
            {collapsibleContent}
          </CollapsibleHeader> : collapsibleContent
        }
      </div>
    );
  }
  updateFilter(filter: IContributionFilter) {
    this.props.onChanged(filter);
    renderFilters(this.props.onChanged, filter, this.props.collapsible);
  }
}

export function updateSelectedDate(date?: Date) {
  const filter: IContributionFilter = { ...filters.props.filter, selectedDate: date };
  filters.updateFilter(filter);
}

export function renderFilters(
  onChanged: (filter: IContributionFilter) => void,
  initialFilter: IContributionFilter = defaultFilter,
  collapsible: boolean = true,
  callback?: () => void,
) {
  const graphParent = $(".filter-container")[0];
  ReactDOM.render(
    <Filters onChanged={onChanged} filter={initialFilter} collapsible={collapsible} />,
    graphParent,
    callback
  );
}
