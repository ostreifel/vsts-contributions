import * as React from "react";
import { Persona, IPersonaProps } from "OfficeFabric/components/Persona";
import { IconButton } from "OfficeFabric/components/Button";
import { NormalPeoplePicker, IBasePickerSuggestionsProps } from "OfficeFabric/components/pickers";
import { searchIdentities } from "../data/identities";

export interface IIdentity {
    displayName: string;
    id: string;
    uniqueName: string;
    imageUrl: string;
}

export interface IIdentityPickerProps {
    identity?: IIdentity;
    width?: number | string;
    placeholder?: string;
    onIdentityChanged?: (identity: IIdentity) => void;
    onIdentityCleared?: () => void;
    readOnly?: boolean;
    forceValue?: boolean;
}

const suggestionProps: IBasePickerSuggestionsProps = {
    suggestionsHeaderText: 'Suggested People',
    noResultsFoundText: 'No results found',
    loadingText: 'Loading'
};

export class IdentityPicker extends React.Component<IIdentityPickerProps, {
    identity?: IIdentity,
    onBlur?: () => void
}> {
    private autoFocus: boolean;
    constructor(props: IIdentityPickerProps) {
        super();
        this.state = {identity: props.identity};
    }
    componentWillReceiveProps(props: IIdentityPickerProps) {
        this.setState({...this.state, identity: props.identity});
    }
    componentDidUpdate() {
        this.autoFocus = false;
    }
    render() {
        return <div
            className="identity-picker"
            style={{
                width: this.props.width || 250,
                height: 48
            }}
        >
            {this.state.identity ?
                <div className={`resolved-identity`} style={{ display: "flex" }}>
                    <Persona
                        primaryText={this.state.identity.displayName}
                        secondaryText={this.state.identity.uniqueName}
                        imageUrl={this.state.identity.imageUrl}
                    />
                    {
                        this.props.readOnly ?
                            null :
                            <IconButton
                                icon={"ChromeClose"}
                                label={"Clear identity selection"}
                                autoFocus={this.autoFocus}
                                title={"Clear identity"}
                                onClick={() => {
                                    if (this.props.onIdentityCleared) {
                                        this.props.onIdentityCleared();
                                    }
                                    this.autoFocus = true;
                                    const identity = this.state.identity;
                                    this.setState({ ...this.state, identity: undefined, onBlur: () => {
                                        if (this.props.forceValue) {
                                            this.setState({ ...this.state, identity });
                                        }
                                    } });
                                }}
                            />
                    }
                </div> :
                <NormalPeoplePicker
                    onResolveSuggestions={searchIdentities}
                    getTextFromItem={(persona: IPersonaProps) => persona.primaryText || "Unkown Identity"}
                    pickerSuggestionsProps={suggestionProps}
                    className={`ms-PeoplePicker identity-selector`}
                    onChange={(items) => {
                        if (items && items.length > 0) {
                            if (this.props.onIdentityChanged) {
                                this.props.onIdentityChanged(this._personaToIIdentity(items[0]));
                            }
                            this.autoFocus = true;
                            this.setState({ ...this.state, identity: this._personaToIIdentity(items[0]) });
                        }
                    }}
                    defaultSelectedItems={[]}
                    inputProps={{
                        placeholder: this.props.placeholder,
                        readOnly: this.props.readOnly,
                        onBlur: () => {
                            if (this.state.onBlur) {
                                this.state.onBlur();
                            }
                        }
                    }}
                    ref={(ref) => ref && this.autoFocus && ref.focus()}
                    key={'normal'}
                />
            }
        </div>;
    }
    private _personaToIIdentity(persona: IPersonaProps): IIdentity {
        if (!persona.secondaryText || !persona.id || !persona.primaryText || !persona.imageUrl) {
            throw new Error("Identity properties not set");
        }
        return {
            uniqueName: persona.secondaryText,
            id: persona.id,
            displayName: persona.primaryText,
            imageUrl: persona.imageUrl
        };
    }
}
