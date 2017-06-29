import * as React from "react";
import { IconButton } from "OfficeFabric/components/Button"
import { Label } from "OfficeFabric/components/Label"
import { TextField } from "OfficeFabric/components/TextField"
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
    resolveSuggestions: (filter: string) => ITag[] | Q.IPromise<ITag[]>;
    inputWidth?: string | number;
    label?: string;
}

export class CompletionDropdown extends React.Component<ICompletionDropdownProps, {
    selected?: ITag,
    onBlur?: () => void
}> {
    private autoFocus: boolean;
    constructor(props: ICompletionDropdownProps) {
        super();
        this.state = {selected: props.selected};
    }
    componentWillReceiveProps(props: ICompletionDropdownProps) {
        this.setState({...this.state, selected: props.selected});
    }
    componentDidUpdate() {
        this.autoFocus = false;
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
            {this.state.selected ?
                <div className={`resolved-item`} style={{ display: "flex" }}>
                    <TextField
                        disabled={true}
                        width={this.props.width || 200}
                        value={this.state.selected.name}
                    />
                    {
                        this.props.readOnly ?
                            null :
                            <IconButton
                                iconProps={{ iconName: "ChromeClose" }}
                                label={"Clear identity selection"}
                                autoFocus={this.autoFocus}
                                onClick={() => {
                                    if (this.props.onSelectionCleared) {
                                        this.props.onSelectionCleared();
                                    }
                                    this.autoFocus = true;
                                    const selected = this.state.selected;
                                    this.setState({ ...this.state, selected: undefined, onBlur: () => {
                                        if (this.props.forceValue) {
                                            this.setState({ ...this.state, selected });
                                        }
                                    } });
                                }}
                            />
                    }
                </div> :
                <TagPicker
                    onResolveSuggestions={this.props.resolveSuggestions}
                    pickerSuggestionsProps={{
                        searchingText: this.props.searchingText || "Searching...",
                        loadingText: this.props.loadingText || "Loading...",
                        noResultsFoundText: this.props.noResultsFoundText || "No results found",
                    }}
                    className={`completion-dropdown-selector`}
                    onChange={(items) => {
                        if (items && items.length > 0) {
                            this.autoFocus = true;
                            this.setState({ ...this.state, selected: items[0] }, () => {
                                if (this.props.onSelectionChanged) {
                                    this.props.onSelectionChanged(items[0]);
                                }
                            });
                        }
                    }}
                    onEmptyInputFocus={() => this.props.resolveSuggestions("")}
                    defaultSelectedItems={[]}
                    inputProps={{
                        placeholder: this.props.placeholder,
                        readOnly: this.props.readOnly,
                        width: this.props.inputWidth || 200,
                        onBlur: () => {
                            if (this.state.onBlur) {
                                this.state.onBlur();
                            }
                        }
                    }}
                    ref={(ref) => ref && this.autoFocus && ref.focus()}
                />
            }
        </div>;
    }
}
