import * as React from "react";
import { UserContribution } from "../../data/contracts";
import { TextField } from "OfficeFabric/components/TextField";
import { toDocument, IContributionDocument } from "./searchDocument";
import { IconButton } from "OfficeFabric/components/Button";

export interface ISearchContributionsProps {
    contributionsKey: string;
    contributions: UserContribution[];
    update: (contributions: UserContribution[]) => void;
}

interface ISearchContributionsState {
    searchText: string;
}
interface ISearchData {
    contributionsKey: string;
    documents: IContributionDocument[];
}

export class SearchContributions extends React.Component<
    ISearchContributionsProps,
    ISearchContributionsState
> {
    private autofocus: boolean;
    constructor(props: ISearchContributionsProps) {
        super(props);
        this.state = {searchText: ""};
    }
    render(): JSX.Element {
        return (
            <div className="search-contributions">
                <TextField
                    className="search-box"
                    placeholder="Search contributions..."
                    value={this.state.searchText}
                    onChanged={(searchText: string) => searchText !== this.state.searchText && this.setState({searchText})}
                    ref={ref => ref && this.autofocus && ref.focus()}
                />
                {this.state.searchText ?
                    <IconButton
                        icon={"ChromeClose"}
                        title={"Clear search text"}
                        onClick={() => {
                            this.autofocus = true;
                            this.setState({searchText: ""});
                        }}
                    />
                    : null
                }
            </div>
        );
    }
    private searchData?: ISearchData;
    private havePropsChanged(): boolean {
        return !this.searchData || this.searchData.contributionsKey !== this.props.contributionsKey;
    }
    private getSearchData(): ISearchData {
        if (!this.searchData || this.havePropsChanged()) {
            this.searchData = {
                contributionsKey: this.props.contributionsKey,
                documents: this.props.contributions.map(toDocument),
            }
        }
        return this.searchData;
    }

    private lastSearch?: string;
    componentDidUpdate() {
        this.autofocus = false;
        if (this.state.searchText && this.havePropsChanged() || this.lastSearch !== this.state.searchText) {
            this.lastSearch = this.state.searchText;
            this.runSearch();
        }
    }
    private runSearch() {
        if (this.state.searchText) {
            const searchText = this.state.searchText;
            const { documents } = this.getSearchData();
            const searchResults = documents.filter(d =>
                d.title.toLocaleLowerCase().indexOf(searchText) >= 0
            );
            const contributions = searchResults.map(res => res.contribution);
            this.props.update(contributions);
        } else {
            this.props.update(this.props.contributions);
        }
    }
}
