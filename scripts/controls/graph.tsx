import * as React from "react";
import * as ReactDOM from "react-dom";

class Graph extends React.Component<{ }, {}> {
    render() {
        return <div>Sample Text</div>;
    }
}
export function renderGraph() {
    const graphParent = $(".graph-container")[0];
    ReactDOM.render(<Graph />, graphParent);
}
