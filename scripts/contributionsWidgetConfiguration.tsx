///<reference types="vss-web-extension-sdk" />
import { renderFilters } from "./controls/filters";

// function showData(filter: IContributionFilter) {
// }
renderFilters(() => {});

VSS.register(VSS.getContribution().id, {});
