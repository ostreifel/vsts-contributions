import * as React from "react";
import * as ReactDOM from "react-dom";
import { Callout } from "OfficeFabric/components/Callout";
import { renderTimeWindow } from "./timeWindow";
import { getContributions } from "../data/provider";
import { IContribution } from "../data/contracts";
import {sliceContributions} from "./sliceContributions";

class Day extends React.Component<{ date: Date, selectedDate?: Date, contributions: IContribution[] }, { showCallout: boolean }> {
    private dayElem: HTMLDivElement;
    constructor() {
        super();
        this.state = { showCallout: false };
    }
    render() {
        const endDate = new Date(this.props.date);
        endDate.setDate(endDate.getDate() + 1);
        const contributions = sliceContributions(this.props.contributions, this.props.date, endDate);
        return <div className="day-container"
            onMouseEnter={(e) => this.showCallout()}
            onMouseOver={(e) => this.showCallout()}
            onMouseLeave={(e) => this.showCallout(false)}
            onClick={(e) => this.toggleSelect()}
        >
            <div className={this.getDayClasses(contributions.length)} ref={ref => this.dayElem = ref}></div>
            <div className={this.getDayFilterClasses()} />
            {this.state.showCallout ?
                <Callout
                    targetElement={this.dayElem}
                >
                    <div>{`${contributions.length} contributions`}</div>
                    <div>{`Day ${this.props.date}`}</div>
                </Callout>
                : null
            }
        </div>;
    }
    private getDayClasses(contributionCount: number): string {
        let classes = "day";
        if (contributionCount > 0) {
            classes += " work";
        }
        return classes;
    }
    private getDayFilterClasses(): string {
        let classes = "day-filter";
        if (this.state.showCallout) {
            classes += " hover";
        }
        if (this.isSelected()) {
            classes += " selected";
        }
        return classes;
    }
    private showCallout(show: boolean = true) {
        if (this.state.showCallout !== show) {
            this.setState({ ...this.state, showCallout: show });
        }
    }
    private isSelected() {
        return this.props.selectedDate && this.props.date.getTime() === this.props.selectedDate.getTime();
    }
    private toggleSelect() {
        if (this.isSelected()) {
            renderGraph();
            renderTimeWindow();
        } else {
            renderGraph(this.props.date);
            renderTimeWindow(this.props.date);
        }
    }
}

class Week extends React.Component<{ date: Date, selectedDate?: Date, contributions: IContribution[] }, {}> {
    render() {
        const date = this.props.date;
        const days: JSX.Element[] = [];
        do {
            days.push(<Day
                date={new Date(date.getTime())}
                selectedDate={this.props.selectedDate}
                contributions={this.props.contributions}
            />);
            date.setDate(date.getDate() + 1);
        } while (date.getDay() > 0 && date < new Date());
        return <div className="week" >{days}</div>;
    }
}


class Graph extends React.Component<{ selectedDate?: Date, contributions: IContribution[] }, {}> {
    render() {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - date.getDay());

        const weeks: JSX.Element[] = [];
        for (let i = 0; i < 52; i++) {
            weeks.unshift(<Week
                date={new Date(date.getTime())}
                selectedDate={this.props.selectedDate}
                contributions={this.props.contributions}
            />)
            date.setDate(date.getDate() - 7);
        }
        return <div className={"year"}>{weeks}</div>;
    }
}
let firstTime = true;
export function renderGraph(selectedDate?: Date) {
    const graphParent = $(".graph-container")[0];
    if (firstTime) {
        ReactDOM.render(<div>{"Loading commits..."}</div>, graphParent);
        firstTime = false;
    }
    getContributions().then(contributions => {
        ReactDOM.render(<Graph selectedDate={selectedDate} contributions={contributions} />, graphParent);
    })
}
