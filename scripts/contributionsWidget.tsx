///<reference types="vss-web-extension-sdk" />
import * as Q from "q";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { IWidget, WidgetSettings, WidgetStatus } from "TFS/Dashboards/WidgetContracts";
import { WidgetStatusHelper } from "TFS/Dashboards/WidgetHelpers";

import { IdentityPicker, IIdentity } from "./controls/IdentityPicker";
import { renderGraphs } from "./controls/showGraphs";
import { defaultFilter, IContributionFilter } from "./filter";

function renderIdentity(identities: IIdentity[]) {
  const identityContainer = $(".identity-container")[0];
  ReactDOM.render(
    <IdentityPicker identities={identities} readOnly />,
    identityContainer
  );
}

class ContributionsWidget implements IWidget {
  filter: IContributionFilter;
  public preload(/*widgetSettings: WidgetSettings*/): Q.IPromise<WidgetStatus> {
    return WidgetStatusHelper.Success();
  }
  public async load(widgetSettings: WidgetSettings): Promise<WidgetStatus> {
    const filter: IContributionFilter = widgetSettings.customSettings.data
      ? JSON.parse(widgetSettings.customSettings.data)
      : await defaultFilter.getValue();
    this.filter = filter;
    renderIdentity(this.filter.identities);
    renderGraphs(this.filter, "small-tiles");
    return WidgetStatusHelper.Success();
  }
  public readonly reload = this.load;

  /*
  private gotoHub(startDate: Date) {
    const endDate = new Date(startDate as any);
    endDate.setDate(endDate.getDate() + 1);

    const filter: IContributionFilter = {
      ...this.filter,
    };
    trackEvent("widgetDayClick", filterToIProperties(filter));
    VSS.getService(VSS.ServiceIds.Navigation).then((navigationService: HostNavigationService) => {
      const collectionUri = VSS.getWebContext().collection.uri;
      const projectName = VSS.getWebContext().project.name;
      const { publisherId, extensionId } = VSS.getExtensionContext();
      const contributionid = `${publisherId}.${extensionId}.contributions-hub`;
      const url = `${collectionUri}${projectName}/_apps/hub/${contributionid}#${encodeURIComponent(JSON.stringify(filter))}`;
      navigationService.openNewWindow(url, "");
    });
  }
  */
}

VSS.register("ContributionsWidget", new ContributionsWidget());
