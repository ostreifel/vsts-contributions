import * as React from "react";
import * as ReactDOM from "react-dom";
import { CollapsibleHeader } from "./CollapsibleHeader";
import { Toggle, IToggleProps } from "OfficeFabric/components/toggle";
import { IdentityPicker } from "./IdentityPicker";
import { ContributionName } from "../data/contracts";
import { IContributionFilter, IEnabledProviders } from "../filter";
import { CompletionDropdown } from "./CompletionDropdown";
import { searchRepositories } from "../data/git/repositories";

/** Toggle except it adds a the css class 'focus' to the container when the toggle is focused */
class FocusToggle extends React.Component<IToggleProps, {focus: boolean}> {
  constructor(props: IToggleProps) {
    super(props);
    this.state = {focus: false};
  }
  render() {
    const classes = this.props.className || "";
    return <Toggle {...this.props}
      className={this.state.focus ? `focus ${classes}`: classes}
      onFocus={() => this.setState({focus: true})}
      onBlur={() => this.setState({focus: false})}
    />;
  }
}

interface IProviderToggleProps {
  providers: IEnabledProviders;
  label: string;
  provider: ContributionName;
  providerChange: (provider: ContributionName, checked: boolean) => {};
}

class ProviderToggle extends React.Component<IProviderToggleProps, {}> {
  render() {
    const { providers, provider, label, providerChange } = this.props;
    return <FocusToggle checked={providers[provider]} label={label} onChanged={checked => providerChange(provider, checked)} />;
  }
}

interface IFiltersProps {
  onChanged: (filter: IContributionFilter) => void;
  filter: IContributionFilter;
  collapsible?: boolean;
}

let filters: Filters;
class Filters extends React.Component<
  IFiltersProps, IContributionFilter
> {
  constructor(props: IFiltersProps) {
    super();
    this.state = props.filter;
    filters = this;
  }
  componentWillReceiveProps(props: IFiltersProps) {
    this.setState(props.filter);
  }
  render() {
    const filter = this.state;
    const providerToggleProps = {
      providers: filter.enabledProviders,
      providerChange: this.updateProvider.bind(this)
    };
    const collapsibleContent =
      <div className="filters">
        <FocusToggle checked={filter.allProjects} label={"All projects"} onChanged={checked => {
          this.updateFilter({ allProjects: checked });
        }} />
        <ProviderToggle {...providerToggleProps} label={"Commits"} provider={"Commit"} />
        <ProviderToggle {...providerToggleProps} label={"Created pull requests"} provider={"CreatePullRequest"} />
        <ProviderToggle {...providerToggleProps} label={"Closed pull requests"}  provider={"ClosePullRequest"} />
        <ProviderToggle {...providerToggleProps} label={"Created work items"} provider={"CreateWorkItem"} />
        <ProviderToggle {...providerToggleProps} label={"Resolved work items"} provider={"ResolveWorkItem"} />
        <ProviderToggle {...providerToggleProps} label={"Closed work items"} provider={"CloseWorkItem"} />
        <ProviderToggle {...providerToggleProps} label={"Created changesets"} provider={"Changeset"} />
        <CompletionDropdown
          label="Repository"
          selected={filter.repository}
          resolveSuggestions={filter => searchRepositories(this.state.allProjects, filter)}
          onSelectionChanged={repository => this.updateFilter({repository})}
          onSelectionCleared={() => this.updateFilter({repository: undefined})}
          placeholder={"All repositories"}
        />
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
          readOnly={"mseng" === VSS.getWebContext().account.name}
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
  updateFilter(filter: Partial<IContributionFilter>) {
    const updatedFilter = {...this.state, ...filter};
    this.props.onChanged(updatedFilter);
    this.setState(updatedFilter);
  }
  updateProvider(provider: ContributionName, enabled: boolean) {
    const filter = {enabledProviders: {...this.state.enabledProviders}};
    filter.enabledProviders[provider] = enabled;
    this.updateFilter(filter);
  }
}

export function updateSelectedDate(date?: Date, expand: boolean = false) {
  let {startDate, endDate} = filters.props.filter;
  if (!date) {
    startDate = endDate = undefined;
  } else if (!expand || !startDate || !endDate) {
    startDate = date;
    endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
  } else if (date.getTime() < startDate.getTime()) {
    startDate = date;
  } else if (date.getTime() >= endDate.getTime()) {
    endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
  }
  const filter: IContributionFilter = { ...filters.props.filter, startDate, endDate };
  filters.updateFilter(filter);
}

export function renderFilters(
  onChanged: (filter: IContributionFilter) => void,
  initialFilter: IContributionFilter,
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
