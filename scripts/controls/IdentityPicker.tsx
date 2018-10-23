import { IPersonaProps } from "office-ui-fabric-react/lib-amd/components/Persona";
import { IBasePickerSuggestionsProps, NormalPeoplePicker } from "office-ui-fabric-react/lib-amd/components/pickers";
import * as React from "react";

import { searchIdentities } from "../data/identities/identities";

export interface IIdentity {
    displayName: string;
    id: string;
    uniqueName: string;
    imageUrl: string;
}

export interface IIdentityPickerProps {
    identities: IIdentity[];
    width?: number | string;
    placeholder?: string;
    onIdentityChanged?: (identities: IIdentity[]) => void;
    onIdentityCleared?: () => void;
    readOnly?: boolean;
    forceValue?: boolean;
}

const suggestionProps: IBasePickerSuggestionsProps = {
    suggestionsHeaderText: 'Suggested People',
    noResultsFoundText: 'No results found',
    loadingText: 'Loading'
};

export class IdentityPicker extends React.Component<IIdentityPickerProps, {}> {
    render() {
        return <div
            className="identity-picker"
        >
            <NormalPeoplePicker
                onResolveSuggestions={searchIdentities}
                getTextFromItem={(persona: IPersonaProps) => persona.primaryText || "Unkown Identity"}
                pickerSuggestionsProps={suggestionProps}
                className={`ms-PeoplePicker identity-selector`}
                onChange={(items) => {
                    if (this.props.onIdentityChanged) {
                        const identities: IIdentity[] = (items || []).map(this._personaToIIdentity.bind(this));
                        this.props.onIdentityChanged(identities);
                    }
                }}
                defaultSelectedItems={this.props.identities.map(this._iIdentityToPersona.bind(this))}
                inputProps={{
                    placeholder: this.props.placeholder,
                    readOnly: this.props.readOnly,
                }}
                key={'normal'}
            />
        </div>;
    }
    private _personaToIIdentity(persona: IPersonaProps): IIdentity {
        if (!persona.primaryText) {
            throw new Error("Identity properties not set");
        } else if (!persona.secondaryText || !persona.id || !persona.imageUrl) {
            console.warn(`${persona.primaryText} is not a direct member of a team. (Support for aad groups is limited)`);
        }
        return {
            uniqueName: persona.secondaryText || "",
            id: persona.id || "",
            displayName: persona.primaryText,
            imageUrl: persona.imageUrl || ""
        };
    }
    private _iIdentityToPersona(identity: IIdentity): IPersonaProps {
        return  {
            id: identity.id,
            primaryText: identity.displayName,
            secondaryText: identity.uniqueName,
            imageUrl: identity.imageUrl,
        };
    }
}
