///<reference types="vss-web-extension-sdk" />
import { renderFilters } from "./controls/filters";
import { renderGraphs } from "./controls/showGraphs";
import { defaultFilter, IContributionFilter } from "./filter";

async function updateGraphs(filter?: IContributionFilter)  {
  filter = filter || await defaultFilter.getValue();

  renderFilters(updateGraphs, filter, true);
  renderGraphs(filter);
}
updateGraphs();

VSS.register(VSS.getContribution().id, {});
