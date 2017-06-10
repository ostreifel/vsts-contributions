///<reference types="vss-web-extension-sdk" />
import * as React from "react";
import * as ReactDOM from "react-dom";
import { renderGraph } from "./controls/graph";

const windowParent = $(".time-window")[0];

renderGraph();

VSS.register(VSS.getContribution().id, {});
