import * as React from "react";
import * as ReactDOM from "react-dom";


export function renderTimeWindow(date?: Date) {
    const graphParent = $(".time-window-container")[0];
    const text = date ? `TODO ${date} clicked` : "TODO Full years contributions";
    ReactDOM.render(<div>{text}</div>, graphParent);
}
