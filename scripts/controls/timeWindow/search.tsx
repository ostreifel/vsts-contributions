import * as React from "react";
import { UserContribution } from "../../data/contracts";
import { TextField } from "OfficeFabric/components/TextField";
import { toDocument, IContributionDocument } from "./searchDocument";

export interface ISearchContributionsProps {
    contributionsKey: string;
    contributions: UserContribution[];
    update: (contributions: UserContribution[]) => void;
}

interface ISearchContributionsState {
    contributionsKey: string;
    documents: IContributionDocument[];
    lookup: {[key: string]: UserContribution};
}

export class SearchContributions extends React.Component<
    ISearchContributionsProps,
    ISearchContributionsState
> {
    _searchText: string;
    constructor(props: ISearchContributionsProps) {
        super(props);
        this.state = this._calculateState(props);
    }
    componentWillReceiveProps(props: ISearchContributionsProps) {
        if (this._haveContributionsChanged(props)) {
            this.setState(this._calculateState(props), () => {
                this._runSearch();
            });
        }
    }
    render(): JSX.Element {
        return (
            <div className="search-contributions">
                <TextField
                    placeholder="Search contributions..."
                    onChanged={this._onChanged.bind(this)}
                />
            </div>
        );
    }
    private _haveContributionsChanged(props: ISearchContributionsProps) {
        return this.state.contributionsKey !== props.contributionsKey;
    }
    private _calculateState(props: ISearchContributionsProps): ISearchContributionsState {
        const state: ISearchContributionsState = {
            contributionsKey: props.contributionsKey,
            documents: props.contributions.map(toDocument),
            lookup: {},
        };
        const { lookup } = state;
        for (const contribution of props.contributions) {
            lookup[contribution.id] = contribution;
        }
        return state;
    }
    private _onChanged(text: string) {
        this._searchText = text.toLocaleLowerCase();
        this._runSearch();
    }
    private _runSearch() {
        if (this._searchText) {
            const searchResults = this.state.documents.filter(d =>
                d.title.toLocaleLowerCase().indexOf(this._searchText) >= 0
            );
            const contributions = searchResults.map(res => res.contribution);
            this.props.update(contributions);
        } else {
            this.props.update(this.props.contributions);
        }
    }
}
