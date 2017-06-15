import * as React from "react";
import * as ReactDOM from "react-dom";
import { Callout } from "OfficeFabric/components/Callout";
import { getContributions } from "../data/provider";
import { IUserContributions, UserContribution, IContributionFilter, filterToIProperties } from "../data/contracts";
import { toDateString, toCountString } from "./messageFormatting";
import { Spinner, SpinnerSize } from "OfficeFabric/components/Spinner";
import { trackEvent } from "../events";
import { Timings } from "../timings";

function getContributionClassDelegate(contributions: IUserContributions): (count: number) => string {
    const counts: number[] = Object.keys(contributions).map(day => contributions[day].length);
    if (counts.length === 0) {
        return () => "";
    }
    counts.sort((a, b) => a - b);
    const thresholds: [number, string][] = [
        [0.25, "work_25"],
        [0.50, "work_50"],
        [0.75, "work_75"]
    ];
    // convert the percentiles to their values for the inputs
    for (const percentile of thresholds) {
        percentile[0] = counts[Math.floor(percentile[0] * counts.length)];
    }
    thresholds.unshift([0, "work_0"]);
    thresholds.reverse();
    return (count: number) => {
        if (count === 0) {
            return "";
        }
        for (const threshold of thresholds) {
            if (count >= threshold[0]) {
                return threshold[1];
            }
        }
        throw new Error("No mapping");
    }
}

class Day extends React.Component<{
    toggleSelect: (date?: Date)=> void,
    date: Date,
    selectedDate?: Date,
    contributions?: UserContribution[],
    getWorkClass: (count: number) => string
},
    { showCallout: boolean }
> {
    private dayElem: HTMLDivElement;
    constructor() {
        super();
        this.state = { showCallout: false };
    }
    render() {
        const endDate = new Date(this.props.date);
        endDate.setDate(endDate.getDate() + 1);
        const contributions = this.props.contributions || [];
        return <div className="day-container"
            onMouseEnter={() => this.showCallout()}
            onMouseOver={() => this.showCallout()}
            onMouseLeave={() => this.showCallout(false)}
            onClick={() => this.toggleSelect()}
        >
            <div className={`day ${this.props.getWorkClass(contributions.length)}`} ref={ref => this.dayElem = ref}></div>
            <div className={this.getDayFilterClasses()} />
            {this.state.showCallout ?
                <Callout
                    targetElement={this.dayElem}
                >
                    <div>{toCountString(contributions.length, "contribution")}</div>
                    <div>{toDateString(this.props.date)}</div>
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
            this.props.toggleSelect();
        } else {
            this.props.toggleSelect(this.props.date);
        }
    }
}

class Week extends React.Component<{
    date: Date,
    selectedDate?: Date,
    contributions: IUserContributions,
    getWorkClass: (count: number) => string,
    toggleSelect: (date?: Date) => void,
}, {}> {
    render() {
        const date = this.props.date;
        const days: JSX.Element[] = [];
        do {
            days.push(<Day
                date={new Date(date.getTime())}
                selectedDate={this.props.selectedDate}
                contributions={this.props.contributions[date.getTime()]}
                getWorkClass={this.props.getWorkClass}
                toggleSelect={this.props.toggleSelect}
            />);
            date.setDate(date.getDate() + 1);
        } while (date.getDay() > 0 && date < new Date());
        return <div className="week">{days}</div>;
    }
}


class Graph extends React.Component<{
    selectedDate?: Date,
    contributions: IUserContributions,
    loading: boolean,
    className?: string,
    toggleSelect: (date?: Date) => void,
}, {}> {
    render() {
        const getWorkClass = getContributionClassDelegate(this.props.contributions);
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - date.getDay());

        const weeks: JSX.Element[] = [];
        for (let i = 0; i < 52; i++) {
            weeks.unshift(<Week
                date={new Date(date.getTime())}
                selectedDate={this.props.selectedDate}
                contributions={this.props.contributions}
                getWorkClass={getWorkClass}
                toggleSelect={this.props.toggleSelect}
            />)
            date.setDate(date.getDate() - 7);
        }
        return <div className={`year ${this.props.className}`}>
            {weeks}
            {this.props.loading ? <Spinner className="graph-spinner" size={SpinnerSize.large} /> : null}
        </div>;
    }
}

export type TileSize = "small-tiles" | "medium-tiles";

let previousContributons: IUserContributions = {};
export function renderGraph(filter: IContributionFilter, toggleSelect: (date?: Date) => void, tileSize: TileSize = "medium-tiles") {
    const graphParent = $(".graph-container")[0];
    const timings = new Timings();
    ReactDOM.render(<Graph
        selectedDate={filter.selectedDate}
        contributions={previousContributons}
        loading={true}
        toggleSelect={toggleSelect}
        className={tileSize}
    />, graphParent);
    timings.measure("drawSpinner");
    getContributions(filter).then(contributions => {
        timings.measure("getContributions");
        previousContributons = contributions;
        ReactDOM.render(<Graph
            selectedDate={filter.selectedDate}
            contributions={contributions}
            loading={false}
            className={tileSize}
            toggleSelect={toggleSelect}
        />, graphParent);
        timings.measure("drawGraph");
        trackEvent("loadGraph", filterToIProperties(filter), timings.measurements);
    })
}
