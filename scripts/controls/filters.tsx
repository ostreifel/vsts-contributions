import { IToggleProps, Toggle } from "office-ui-fabric-react/lib-amd/components/toggle";
import * as React from "react";
import * as ReactDOM from "react-dom";

import { ContributionName } from "../data/contracts";
import { searchRepositories } from "../data/git/repositories";
import { IContributionFilter, IEnabledProviders } from "../filter";
import { CollapsibleHeader } from "./CollapsibleHeader";
import { CompletionDropdown } from "./CompletionDropdown";
import { IdentityPicker } from "./IdentityPicker";

/** Toggle except it adds a the css class 'focus' to the container when the toggle is focused */
class FocusToggle extends React.Component<IToggleProps, { focus: boolean }> {
  constructor(props: IToggleProps) {
    super(props);
    this.state = { focus: false };
  }
  render() {
    const classes = this.props.className || "";
    return <Toggle {...this.props}
      className={this.state.focus ? `focus ${classes}` : classes}
      onFocus={() => this.setState({ focus: true })}
      onBlur={() => this.setState({ focus: false })}
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

class Filters extends React.Component<
  IFiltersProps, {}
  > {
  render() {
    const filter = this.props.filter;
    const providerToggleProps = {
      providers: filter.enabledProviders,
      providerChange: this.updateProvider.bind(this)
    };
    const collapsibleContent =
      <div>
        <IdentityPicker
          identities={filter.identities}
          onIdentityChanged={identities => {
            this.updateFilter({ ...filter, identities });
          }}
          forceValue={true}
          width={400}
        />
        <div className="filters">
          <FocusToggle checked={filter.allProjects} label={"All projects"} onChanged={checked => {
            this.updateFilter({ allProjects: checked });
          }} />
          <FocusToggle checked={filter.sharedScale} label={"Shared Scale"} onChanged={checked => {
            this.updateFilter({ sharedScale: checked });
          }} />
          <ProviderToggle {...providerToggleProps} label={"Commits"} provider={"Commit"} />
          <ProviderToggle {...providerToggleProps} label={"Created pull requests"} provider={"CreatePullRequest"} />
          <ProviderToggle {...providerToggleProps} label={"Closed pull requests"} provider={"ClosePullRequest"} />
          <ProviderToggle {...providerToggleProps} label={"Reviewed pull requests"} provider={"ReviewPullRequest"} />
          <ProviderToggle {...providerToggleProps} label={"Created work items"} provider={"CreateWorkItem"} />
          <ProviderToggle {...providerToggleProps} label={"Resolved work items"} provider={"ResolveWorkItem"} />
          <ProviderToggle {...providerToggleProps} label={"Closed work items"} provider={"CloseWorkItem"} />
          <ProviderToggle {...providerToggleProps} label={"Created changesets"} provider={"Changeset"} />
          <CompletionDropdown
            label="Repository"
            selected={filter.repositories}
            resolveSuggestions={(search, selected) => searchRepositories(filter.allProjects, search, selected)}
            onSelectionChanged={repositories => this.updateFilter({ repositories })}
            placeholder={"Search repositories..."}
          />
        </div>
      </div>;
    return (
      <div>
        {this.props.collapsible ?
          <CollapsibleHeader
            title="Activity Filters"
            buttonName="Filters"
            className="filter-header"
            level={4}
          >
            {collapsibleContent}
          </CollapsibleHeader> : collapsibleContent
        }
      </div>
    );
  }
  updateFilter(filter: Partial<IContributionFilter>) {
    const updatedFilter = { ...this.props.filter, ...filter };
    this.props.onChanged(updatedFilter);
  }
  updateProvider(provider: ContributionName, enabled: boolean) {
    const filter = { enabledProviders: { ...this.props.filter.enabledProviders } };
    filter.enabledProviders[provider] = enabled;
    this.updateFilter(filter);
  }
}


export function renderFilters(
  onChanged: (filter: IContributionFilter) => void,
  initialFilter: IContributionFilter,
  collapsible: boolean = true,
  callback?: () => void,
) {
  const props = { onChanged, filter: initialFilter, collapsible };
  const graphParent = $(".filter-container")[0];
  ReactDOM.render(
    <Filters {...props} />,
    graphParent,
    callback
  );
}
