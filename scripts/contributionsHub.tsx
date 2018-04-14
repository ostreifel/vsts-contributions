///<reference types="vss-web-extension-sdk" />
import { renderFilters } from "./controls/filters";
import { renderGraphs } from "./controls/showGraphs";
import { renderTimeWindow } from "./controls/timeWindow/timeWindow";
import { updateSelectedDate } from "./controls/filters";
import { defaultFilter, IContributionFilter } from "./filter";

async function updateGraphs(filter?: IContributionFilter)  {
  filter = filter || await defaultFilter.getValue();

  renderFilters(updateGraphs, filter, true);
  renderGraphs(filter, updateSelectedDate);
  renderTimeWindow(filter);
}
updateGraphs();

VSS.register(VSS.getContribution().id, {});
