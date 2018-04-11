import * as React from "react";
import { Label } from "OfficeFabric/components/Label"
import { TagPicker, ITag } from "OfficeFabric/components/pickers";

interface ICompletionDropdownProps {
    selected?: ITag;
    width?: string | number;
    readOnly?: boolean;
    placeholder?: string;
    noResultsFoundText?: string;
    loadingText?: string;
    searchingText?: string;
    onSelectionCleared?: () => void;
    onSelectionChanged?: (selection: ITag) => void;
    forceValue?: boolean;
    resolveSuggestions: (filter: string) => ITag[] | PromiseLike<ITag[]>;
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
                    if (items && items.length > 0) {
                        if (this.props.onSelectionChanged) {
                            this.props.onSelectionChanged(items[0]);
                        }
                    }
                }}
                onEmptyInputFocus={() => this.props.resolveSuggestions("")}
                defaultSelectedItems={[]}
                inputProps={{
                    placeholder: this.props.placeholder,
                    readOnly: this.props.readOnly,
                    width: this.props.inputWidth || 200,
                }}
            />
        </div>;
    }
}
