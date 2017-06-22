import * as React from "react";
import { IconButton } from "OfficeFabric/components/Button"
import { Label } from "OfficeFabric/components/Label"
import { TextField } from "OfficeFabric/components/TextField"
import { TagPicker, ITag } from "OfficeFabric/components/pickers";

interface ICompletionDropdownProps {
    selectedText?: string;
    width?: string | number;
    readOnly?: boolean;
    placeholder?: string;
    noResultsFoundText?: string;
    loadingText?: string;
    onSelectionCleared?: () => void;
    onSelectionChanged?: (text: string) => void;
    forceValue?: boolean;
    resolveSuggestions: (filter: string) => ITag[] | Q.IPromise<ITag[]>;
    inputWidth?: string | number;
    label?: string;
}

export class CompletionDropdown extends React.Component<ICompletionDropdownProps, {
    selectedText?: string,
    onBlur?: () => void
}> {
    private autoFocus: boolean;
    constructor(props: ICompletionDropdownProps) {
        super();
        this.state = {selectedText: props.selectedText};
    }
    componentWillReceiveProps(props: ICompletionDropdownProps) {
        this.setState({...this.state, selectedText: props.selectedText});
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
            {this.state.selectedText ?
                <div className={`resolved-item`} style={{ display: "flex" }}>
                    <TextField
                        disabled={true}
                        width={this.props.width || 200}
                        value={this.state.selectedText}
                    />
                    {
                        this.props.readOnly ?
                            null :
                            <IconButton
                                icon={"ChromeClose"}
                                label={"Clear identity selection"}
                                autoFocus={this.autoFocus}
                                onClick={() => {
                                    if (this.props.onSelectionCleared) {
                                        this.props.onSelectionCleared();
                                    }
                                    this.autoFocus = true;
                                    const selectedText = this.state.selectedText;
                                    this.setState({ ...this.state, selectedText: undefined, onBlur: () => {
                                        if (this.props.forceValue) {
                                            this.setState({ ...this.state, selectedText });
                                        }
                                    } });
                                }}
                            />
                    }
                </div> :
                <TagPicker
                    onResolveSuggestions={this.props.resolveSuggestions}
                    pickerSuggestionsProps={{
                        searchingText: this.props.loadingText || "Loading...",
                        noResultsFoundText: this.props.noResultsFoundText || "No results found",
                    }}
                    className={`completion-dropdown-selector`}
                    onChange={(items) => {
                        if (items && items.length > 0) {
                            if (this.props.onSelectionChanged) {
                                this.props.onSelectionChanged(items[0].name);
                            }
                            this.autoFocus = true;
                            this.setState({ ...this.state, selectedText: items[0].name });
                        }
                    }}
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
