import * as React from "react";
import { Persona, IPersonaProps } from "OfficeFabric/components/Persona"
import { IconButton } from "OfficeFabric/components/Button"
import { NormalPeoplePicker, IBasePickerSuggestionsProps } from "OfficeFabric/components/pickers";
import { getIdentities } from "../data/identities"
import { CachedValue } from "../data/CachedValue";

function getPersonas() {
    return getIdentities().then(identities => {
        const personas: IPersonaProps[] = [];
        for (const id in identities) {
            const identity = identities[id];
            personas.push({
                primaryText: identity.displayName,
                secondaryText: identity.uniqueName,
                imageUrl: identity.imageUrl,
                id: identity.id
            });
        }
        return personas;
    });
}

const personas = new CachedValue(getPersonas);


export interface IIdentity {
    displayName: string;
    id: string;
    uniqueName: string;
    imageUrl: string;
}

export interface IIdentityPickerProps {
    defaultIdentity?: IIdentity;
    placeholder?: string;
    onIdentityChanged?: (identity: IIdentity) => void;
    onIdentityCleared?: () => void;
}

const suggestionProps: IBasePickerSuggestionsProps = {
    suggestionsHeaderText: 'Suggested People',
    noResultsFoundText: 'No results found',
    loadingText: 'Loading'
};

export class IdentityPicker extends React.Component<IIdentityPickerProps, {
    identity?: IIdentity,
}> {
    private autoFocus: boolean;
    constructor() {
        super();
        this.state = {};
    }
    componentWillMount() {
        this.setState({ ...this.state, identity: this.props.defaultIdentity })
    }
    componentDidUpdate() {
        this.autoFocus = false;
    }
    render() {
        return <div className="identity-picker">
            {this.state.identity ?
                <div className={`resolved-identity`}>
                    <Persona
                        primaryText={this.state.identity.displayName}
                        secondaryText={this.state.identity.uniqueName}
                        imageUrl={this.state.identity.imageUrl}
                    />
                    <IconButton
                        icon={"ChromeClose"}
                        label={"Clear identity selection"}
                        autoFocus={this.autoFocus}
                        onClick={() => {
                            if (this.props.onIdentityCleared) {
                                this.props.onIdentityCleared();
                            }
                            this.autoFocus = true;
                            this.setState({ ...this.state, identity: undefined });
                        }}
                    />
                </div> :
                <NormalPeoplePicker
                    onResolveSuggestions={(filter) => this._getIdentities(filter)}
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
    private _getIdentities(filter: string) {
        const lowerFilter = filter.toLocaleLowerCase();
        function match(str?: string) {
            return str && str.toLocaleLowerCase().lastIndexOf(lowerFilter, 0) >= 0;
        }
        return personas.getValue().then(personas => personas.filter(p => match(p.primaryText) || match(p.secondaryText)));
    }
}
