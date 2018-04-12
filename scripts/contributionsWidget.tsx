///<reference types="vss-web-extension-sdk" />
import * as React from "react";
import * as ReactDOM from "react-dom";
import { renderGraph } from "./controls/graph";
import { defaultFilter, IContributionFilter, filterToIProperties } from "./filter";
import { WidgetStatusHelper } from "TFS/Dashboards/WidgetHelpers";
import {
  IWidget,
  WidgetSettings,
  WidgetStatus
} from "TFS/Dashboards/WidgetContracts";
import { IIdentity, IdentityPicker } from "./controls/IdentityPicker";
import * as Q from "q";
import { HostNavigationService } from "VSS/SDK/Services/Navigation";
import { trackEvent } from "./events";

function renderIdentity(identity: IIdentity) {
  const identityContainer = $(".identity-container")[0];
  ReactDOM.render(
    <IdentityPicker identity={identity} readOnly />,
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
    renderIdentity(this.filter.identity);
    renderGraph(this.filter, this.gotoHub.bind(this), "small-tiles");
    return WidgetStatusHelper.Success();
  }
  public readonly reload = this.load;

  private gotoHub(startDate: Date) {
    const endDate = new Date(startDate as any);
    endDate.setDate(endDate.getDate() + 1);

    const filter: IContributionFilter = { ...this.filter, startDate, endDate };
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
}

VSS.register("ContributionsWidget", new ContributionsWidget());
