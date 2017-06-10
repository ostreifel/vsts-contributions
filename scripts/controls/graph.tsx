import * as React from "react";
import * as ReactDOM from "react-dom";
import { Callout } from "OfficeFabric/components/Callout";
import { renderTimeWindow } from "./timeWindow";

class Day extends React.Component<{ date: Date, selectedDate?: Date }, { showCallout: boolean }> {
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
            onClick={(e)=> this.select()}
        >
            <div className="day" ref={ref => this.dayElem = ref}></div>
            <div className={this.getDayFilterClasses()}/>
            {this.state.showCallout ?
                <Callout
                    targetElement={this.dayElem}
                    beakWidth={0}
                >
                    {`Day ${this.props.date}`}
                </Callout>
                : null
            }
        </div>;
    }
    private getDayFilterClasses(): string {
        let classes = "day-filter";
        if (this.state.showCallout) {
            classes += " hover";
        }
        if (this.props.selectedDate && this.props.date.getTime() === this.props.selectedDate.getTime()) {
            classes += " selected";
        }
        return classes;
    }
    private showCallout(show: boolean = true) {
        if (this.state.showCallout !== show) {
            this.setState({ ...this.state, showCallout: show });
        }
    }
    private select() {
        renderGraph(this.props.date);
        renderTimeWindow(this.props.date);
    }
}

class Week extends React.Component<{date: Date, selectedDate?: Date}, {}> {
    render() {
        const date = this.props.date;
        const days: JSX.Element[] = [];
        do {
            days.push(<Day date={new Date(date.getTime())} selectedDate={this.props.selectedDate}/>);
            date.setDate(date.getDate() + 1);
        } while (date.getDay() > 0 && date < new Date());
        return <div className="week" >{days}</div>;
    }
}


class Graph extends React.Component<{selectedDate?: Date}, {}> {
    render() {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - date.getDay());

        const weeks: JSX.Element[] = [];
        for (let i = 0; i < 52; i++) {
            weeks.unshift(<Week date={new Date(date.getTime())} selectedDate={this.props.selectedDate} />);
            date.setDate(date.getDate() - 7);
        }
        return <div className={"year"}>{weeks}</div>;
    }
}
export function renderGraph(selectedDate?: Date) {
    const graphParent = $(".graph-container")[0];
    ReactDOM.render(<Graph selectedDate={selectedDate} />, graphParent);
}
