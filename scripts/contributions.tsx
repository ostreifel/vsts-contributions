///<reference types="vss-web-extension-sdk" />
import * as React from "react";
import * as ReactDOM from "react-dom";
import { renderFilters } from "./controls/filters";

const windowParent = $(".time-window")[0];

renderFilters();

VSS.register(VSS.getContribution().id, {});
