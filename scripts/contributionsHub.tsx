///<reference types="vss-web-extension-sdk" />
import { IContributionFilter } from "./data/contracts";
import { renderFilters } from "./controls/filters";
import { renderGraph } from "./controls/graph";
import { renderTimeWindow } from "./controls/timeWindow";
import { updateSelectedDate } from "./controls/filters";

function showData(filter: IContributionFilter) {
  renderGraph(filter, updateSelectedDate);
  renderTimeWindow(filter);
}
renderFilters(showData);

VSS.register(VSS.getContribution().id, {});
