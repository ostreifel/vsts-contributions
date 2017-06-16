///<reference types="vss-web-extension-sdk" />
import { renderFilters } from "./controls/filters";
import { renderGraph } from "./controls/graph";
import { renderTimeWindow } from "./controls/timeWindow";
import { updateSelectedDate } from "./controls/filters";
import { defaultFilter, IContributionFilter, deepEqual } from "./filter";
import { HostNavigationService } from "VSS/SDK/Services/Navigation";

VSS.getService(VSS.ServiceIds.Navigation).then(function(navigationService: HostNavigationService) {
  let currentFilter: IContributionFilter;
  function updateHash(filter: IContributionFilter) {
    if (!deepEqual(currentFilter, filter)) {
      const hash = encodeURI(JSON.stringify(filter));
      navigationService.setHash(hash);
    }
  }

  function updateForHash(hash: string) {
    if (!hash) {
      updateHash(defaultFilter);
    }
    currentFilter = JSON.parse(decodeURI(hash));
    renderFilters(updateHash, currentFilter, true);
    renderGraph(currentFilter, updateSelectedDate);
    renderTimeWindow(currentFilter);
  }
  // Get current hash value from host url
  navigationService.getHash().then(updateForHash);
  navigationService.onHashChanged(updateForHash);
});

VSS.register(VSS.getContribution().id, {});
