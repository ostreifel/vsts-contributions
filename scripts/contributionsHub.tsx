///<reference types="vss-web-extension-sdk" />
import { renderFilters } from "./controls/filters";
import { renderGraph } from "./controls/graph";
import { renderTimeWindow } from "./controls/timeWindow";
import { updateSelectedDate } from "./controls/filters";
import { defaultFilter, IContributionFilter } from "./filter";
import { HostNavigationService } from "VSS/SDK/Services/Navigation";

VSS.getService(VSS.ServiceIds.Navigation).then(function(navigationService: HostNavigationService) {
  function updateHash(filter: IContributionFilter) {
      const hash = encodeURI(JSON.stringify(filter));
      navigationService.setHash(hash);
  }

  function updateForHash(hash: string) {
    if (!hash) {
      updateHash(defaultFilter);
    }
    const filter = JSON.parse(decodeURI(hash));
    renderFilters(updateHash, filter, true);
    renderGraph(filter, updateSelectedDate);
    renderTimeWindow(filter);
  }
  // Get current hash value from host url
  navigationService.getHash().then(updateForHash);
  navigationService.onHashChanged(updateForHash);
});

VSS.register(VSS.getContribution().id, {});
