import { IContributionFilter } from "./data/contracts";

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
