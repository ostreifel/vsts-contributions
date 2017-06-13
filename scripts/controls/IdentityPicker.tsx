import * as React from "react";
// import { IdentityRef } from "VSS/WebApi/Contracts";
import { Persona, IPersonaProps } from "OfficeFabric/components/Persona"
import { IconButton } from "OfficeFabric/components/Button"
import { NormalPeoplePicker, IBasePickerSuggestionsProps } from "OfficeFabric/components/pickers";

export interface IIdentity {
    name: string;
    id: string;
    email: string;
    picture: string;
}

export interface IIdentityPickerProps {
    defaultIdentityId?: string;
    placeholder?: string;
    onIdentityChanged: (identity: IIdentity) => void
}

const identities: IPersonaProps[] = [
    {
        primaryText: VSS.getWebContext().user.name,
        id: VSS.getWebContext().user.id,
        secondaryText: VSS.getWebContext().user.email,
        imageUrl: `${VSS.getWebContext().collection.uri}_api/_common/identityImage?size=2&id=${VSS.getWebContext().user.id}`
    }
];

const suggestionProps: IBasePickerSuggestionsProps = {
    suggestionsHeaderText: 'Suggested People',
    noResultsFoundText: 'No results found',
    loadingText: 'Loading'
};

export class IdentityPicker extends React.Component<IIdentityPickerProps, {
    identityId?: string,
    identities?: IPersonaProps[]
}> {
    button: IconButton;
    constructor() {
        super();
        this.state = {};
    }
    componentWillMount() {
        this.setState({ ...this.state, identityId: this.props.defaultIdentityId })
    }
    render() {
        return <div className="identity-picker">
            {this.state.identityId ?
                <div className={`resolved-identity`}>
                    <Persona
                        {...identities[0]}
                    />
                    <IconButton
                        icon={"ChromeClose"}
                        label={"Clear identity selection"}
                        autoFocus
                        onClick={() => {
                            this.setState({ ...this.state, identityId: undefined });
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
                            this.setState({ ...this.state, identityId: items[0].id });
                        }
                    }}
                    defaultSelectedItems={[]}
                    inputProps={{
                        placeholder: this.props.placeholder,
                    }}
                    ref={(ref) => ref && ref.focus()}
                    key={'normal'}
                />
            }
        </div>;
    }
    private _getIdentities(filter: string) {
        const lowerFilter = filter.toLocaleLowerCase();
        function match(str?: string) {
            return str && str.toLocaleLowerCase().lastIndexOf(lowerFilter, 0) >= 0;
        }
        return identities.filter(i => match(i.primaryText) || match(i.secondaryText));
    }
}
