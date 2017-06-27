///<reference types="vss-web-extension-sdk" />
import { renderFilters } from "./controls/filters";
import { renderGraph } from "./controls/graph";
import { renderTimeWindow } from "./controls/timeWindow/timeWindow";
import { updateSelectedDate } from "./controls/filters";
import { defaultFilter, IContributionFilter } from "./filter";
import { HostNavigationService } from "VSS/SDK/Services/Navigation";
import * as Q from "q";

VSS.getService(VSS.ServiceIds.Navigation).then(function (navigationService: HostNavigationService) {
  function parseHash(hash: string): Q.IPromise<IContributionFilter> {
    function parseHashStr(hash: string) {
      try {
        const filter: IContributionFilter = JSON.parse(decodeURIComponent(hash));
        // Json doesn't understand dates -- convert the date fields back to dates
        if (filter.startDate) {
          filter.startDate = new Date(filter.startDate);
        }
        if (filter.endDate) {
          filter.endDate = new Date(filter.endDate);
        }
        return Q(filter);
      } catch (e) {
        return defaultFilter.getValue();
      }
    }
    if (hash) {
      return parseHashStr(hash);
    }
    return Q.all([navigationService.getCurrentState(), defaultFilter.getValue()]).then(([state, defaultFilter]) => {
      const [hash] = Object.keys(state);
      if (hash) {
        return parseHashStr(hash);
      }
      return defaultFilter;
    });
  }
  function updateHash(filter: IContributionFilter) {
    const hash = encodeURIComponent(JSON.stringify(filter));
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
