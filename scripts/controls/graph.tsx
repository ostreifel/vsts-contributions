import * as React from "react";
import * as ReactDOM from "react-dom";
import { Callout } from "OfficeFabric/components/Callout";

class Day extends React.Component<{ date: number }, { showCallout: boolean }> {
    private dayElem: HTMLDivElement;
    constructor() {
        super();
        this.state = { showCallout: false };
    }
    render() {
        return <div className="day-container"
            onMouseEnter={(e) => this.showCallout()}
            onMouseOver={(e) => this.showCallout()}
            onMouseLeave={(e) => this.showCallout(false)}
        >
            <div className="day" ref={ref => this.dayElem = ref}></div>
            {this.state.showCallout ?
                <Callout
                    targetElement={this.dayElem}
                    onDismiss={() => this.showCallout(false)}
                    beakWidth={0}
                >
                    {`Day ${this.props.date}`}
                </Callout>
                : null
            }
        </div>;
    }
    private showCallout(show: boolean = true) {
        this.setState({ ...this.state, showCallout: show });
    }
}

class Week extends React.Component<{}, {}> {
    render() {
        const days: JSX.Element[] = [];
        for (let i = 0; i < 10; i++) {
            days.push(<Day date={i} />);
        }
        return <div className="week" >{days}</div>;
    }
}

class Graph extends React.Component<{}, {}> {
    render() {
        const weeks: JSX.Element[] = [];
        for (let i = 0; i < 52; i++) {
            weeks.push(<Week />);
        }
        return <div className={"year"}>{weeks}</div>;
    }
}
export function renderGraph() {
    const graphParent = $(".graph-container")[0];
    ReactDOM.render(<Graph />, graphParent);
}
