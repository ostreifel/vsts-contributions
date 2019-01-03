///<reference types="vss-web-extension-sdk" />
import "promise-polyfill/src/polyfill";
import { HostNavigationService } from "VSS/SDK/Services/Navigation";

import { renderFilters } from "./controls/filters";
import { renderGraphs } from "./controls/showGraphs";
import { defaultFilter, IContributionFilter } from "./filter";


VSS.getService<HostNavigationService>(VSS.ServiceIds.Navigation).then(async (navService) => {
  function updateHash(filter: IContributionFilter) {
    const hash = encodeURIComponent(JSON.stringify(filter));
    navService.setHash(hash);
  }
  async function parseHash(hash: string): Promise<IContributionFilter> {
    try {
      return JSON.parse(decodeURIComponent(hash));
    } catch (e) {
      if (hash) {
        console.log("could not parse hash", hash, e);
      }
      return defaultFilter.getValue();
    }
  }
  async function updateFromHash(hash: string) {
    const filter = await parseHash(hash);

    renderFilters(updateHash, filter, true);
    renderGraphs(filter);
  }
  const hash = await navService.getHash();
  updateFromHash(hash);
  navService.onHashChanged(updateFromHash);
});


VSS.register(VSS.getContribution().id, {});
