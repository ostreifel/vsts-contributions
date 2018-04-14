import * as React from "react";
import { Label } from "OfficeFabric/components/Label";
import { TagPicker, ITag } from "OfficeFabric/components/pickers";

interface ICompletionDropdownProps {
    selected?: ITag[];
    width?: string | number;
    readOnly?: boolean;
    placeholder?: string;
    noResultsFoundText?: string;
    loadingText?: string;
    searchingText?: string;
    onSelectionChanged?: (selection: ITag[]) => void;
    forceValue?: boolean;
    resolveSuggestions: (filter: string, selected?: ITag[]) => ITag[] | PromiseLike<ITag[]>;
    inputWidth?: string | number;
    label?: string;
}

export class CompletionDropdown extends React.Component<ICompletionDropdownProps, {}> {
    constructor(props: ICompletionDropdownProps) {
        super();
        this.state = {selected: props.selected};
    }
    render() {
        return <div
            className="completion-dropdown"
            style={{
                width: this.props.width || 250,
                height: 48
            }}
        >
            {this.props.label ?
                <Label>{this.props.label}</Label> :
                null
            }
            <TagPicker
                onResolveSuggestions={this.props.resolveSuggestions}
                pickerSuggestionsProps={{
                    searchingText: this.props.searchingText || "Searching...",
                    loadingText: this.props.loadingText || "Loading...",
                    noResultsFoundText: this.props.noResultsFoundText || "No results found",
                }}
                className="completion-dropdown-selector"
                onChange={(items) => {
                    if (this.props.onSelectionChanged) {
                        this.props.onSelectionChanged(items || []);
                    }
                }}
                onEmptyInputFocus={(selected) => this.props.resolveSuggestions("", selected)}
                onGetMoreResults={(filter, selected) => this.props.resolveSuggestions(filter, selected)}
                defaultSelectedItems={this.props.selected}
                inputProps={{
                    placeholder: this.props.placeholder,
                    readOnly: this.props.readOnly,
                    width: this.props.inputWidth || 200,
                }}
            />
        </div>;
    }
}
