///<reference types="vss-web-extension-sdk" />
import { IContributionFilter } from "./data/contracts";
import { renderFilters } from "./controls/filters";
import { renderGraph } from "./controls/graph";
import { renderTimeWindow } from "./controls/timeWindow";

function showData(filter: IContributionFilter) {
  renderGraph(filter);
  renderTimeWindow(filter);
}
renderFilters(showData);

VSS.register(VSS.getContribution().id, {});
