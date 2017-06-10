///<reference types="vss-web-extension-sdk" />
import { renderFilters } from "./controls/filters";

renderFilters();

VSS.register(VSS.getContribution().id, {});
