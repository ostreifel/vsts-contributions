import { IIdentity } from "./controls/IdentityPicker";
import { IProperties } from "./events";

export interface IEnabledProviders {
    Commit: boolean;
    CreatePullRequest: boolean;
    ClosePullRequest: boolean;
    CreateWorkItem: boolean;
    CloseWorkItem: boolean;
    ResolveWorkItem: boolean;
}

export interface IContributionFilter {
    identity: IIdentity;
    allProjects: boolean;
    selectedDate?: Date;
    enabledProviders: IEnabledProviders;
}

export function filterToIProperties(filter: IContributionFilter): IProperties {
    const properties: IProperties = {};
    for (let providerKey in filter.enabledProviders) {
        properties[providerKey] = String(filter.enabledProviders[providerKey]);
    }
    properties["selectedDate"] = String(!!filter.selectedDate);
    properties["allProjects"] = String(!!filter.allProjects);
    return properties;
}

export const defaultFilter: IContributionFilter = {
  identity: {
    displayName: VSS.getWebContext().user.name,
    id: VSS.getWebContext().user.id,
    uniqueName: VSS.getWebContext().user.email,
    imageUrl: `${VSS.getWebContext().collection
      .uri}_api/_common/identityImage?size=2&id=${VSS.getWebContext().user.id}`
  },
  allProjects: false,
  enabledProviders: {
    Commit: true,
    CreatePullRequest: true,
    ClosePullRequest: true,
    CloseWorkItem: true,
    CreateWorkItem: true,
    ResolveWorkItem: true
  }
};
