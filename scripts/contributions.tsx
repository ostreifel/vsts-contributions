///<reference types="vss-web-extension-sdk" />
import * as React from "react";
import * as ReactDOM from "react-dom";
import { renderGraph } from "./controls/graph";
import { renderTimeWindow } from "./controls/timeWindow";

const windowParent = $(".time-window")[0];

renderGraph();
renderTimeWindow();

VSS.register(VSS.getContribution().id, {});
