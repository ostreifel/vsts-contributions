///<reference types="vss-web-extension-sdk" />
import { renderFilters } from "./controls/filters";
import { renderGraph } from "./controls/graph";
import { renderTimeWindow } from "./controls/timeWindow";
import { updateSelectedDate } from "./controls/filters";
import { defaultFilter, IContributionFilter } from "./filter";
import { HostNavigationService } from "VSS/SDK/Services/Navigation";
import * as Q from "q";

VSS.getService(VSS.ServiceIds.Navigation).then(function (navigationService: HostNavigationService) {
  function parseHash(hash: string): Q.IPromise<IContributionFilter> {
    if (!hash) {
      return defaultFilter.getValue();
    }
    const filter: IContributionFilter = JSON.parse(decodeURI(hash));
    // Json doesn't understand dates -- convert the date fields back to dates
    if (filter.selectedDate) {
      filter.selectedDate = new Date(filter.selectedDate);
    }
    return Q(filter);
  }
  function updateHash(filter: IContributionFilter) {
    const hash = encodeURI(JSON.stringify(filter));
    navigationService.setHash(hash);
  }

  function updateForHash(hash: string) {
    parseHash(hash).then(filter => {
      renderFilters(updateHash, filter, true);
      renderGraph(filter, updateSelectedDate);
      renderTimeWindow(filter);
    });
  }
  // Get current hash value from host url
  navigationService.getHash().then(updateForHash);
  navigationService.onHashChanged(updateForHash);
});

VSS.register(VSS.getContribution().id, {});
