///<reference types="vss-web-extension-sdk" />
import * as React from "react";
import * as ReactDOM from "react-dom";
import { renderGraph } from "./controls/graph";
import { defaultFilter } from "./defaultFilter";
import { IContributionFilter } from "./data/contracts";
import { WidgetStatusHelper } from "TFS/Dashboards/WidgetHelpers";
import {
  IWidget,
  WidgetSettings,
  WidgetStatus
} from "TFS/Dashboards/WidgetContracts";
import { IIdentity, IdentityPicker } from "./controls/IdentityPicker";
import * as Q from "q";

function gotoHub(date?: Date) {
  console.log("TODO goto hub", date);
}
function renderIdentity(identity: IIdentity) {
  const identityContainer = $(".identity-container")[0];
  ReactDOM.render(
    <IdentityPicker defaultIdentity={identity} readOnly />,
    identityContainer
  );
}

class ContributionsWidget implements IWidget {
  public preload(/*widgetSettings: WidgetSettings*/): Q.IPromise<WidgetStatus> {
    return WidgetStatusHelper.Success();
  }
  public load(widgetSettings: WidgetSettings): Q.IPromise<WidgetStatus> {
    const filter: IContributionFilter = widgetSettings.customSettings.data
      ? JSON.parse(widgetSettings.customSettings.data)
      : defaultFilter;
    renderIdentity(filter.identity);
    renderGraph(defaultFilter, gotoHub, "small-tiles");
    return WidgetStatusHelper.Success();
  }
  public readonly reload = this.load;
}

VSS.register("ContributionsWidget", new ContributionsWidget());
