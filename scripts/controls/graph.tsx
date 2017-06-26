import * as React from "react";
import * as ReactDOM from "react-dom";
import { Callout } from "OfficeFabric/components/Callout";
import { getContributions } from "../data/provider";
import { IUserContributions, UserContribution } from "../data/contracts";
import { toDateString, toCountString } from "./messageFormatting";
import { Spinner, SpinnerSize } from "OfficeFabric/components/Spinner";
import { trackEvent } from "../events";
import { Timings } from "../timings";
import { IContributionFilter, filterToIProperties } from "../filter"
import { DelayedFunction } from "VSS/Utils/Core"

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
    const largest = counts[counts.length - 1];
    // convert the percentiles to their values for the inputs
    for (const threshold of thresholds) {
        threshold[0] = Math.floor(threshold[0] * largest);
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
    toggleSelect: (startDate?: Date, endDate?: Date) => void,
    date: Date,
    startDate?: Date,
    endDate?: Date,
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
        const contributions = this.props.contributions || [];
        return <div className="day-container"
            onMouseEnter={() => this.showCallout()}
            onMouseOver={() => this.showCallout()}
            onMouseLeave={() => this.showCallout(false)}
            onClick={this.toggleSelect.bind(this)}
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
        const {startDate, endDate, date} = this.props;
        return startDate &&
        endDate &&
        date.getTime() >= startDate.getTime() &&
        date.getTime() < endDate.getTime();
    }
    private toggleSelect(e: MouseEvent) {
        if (e.shiftKey) {
            const nextDay = new Date(this.props.date);
            nextDay.setDate(nextDay.getDate() + 1);
            this.props.toggleSelect(undefined, nextDay);
        } else {
            if (this.isSelected()) {
                this.props.toggleSelect();
            } else {
                this.props.toggleSelect(this.props.date);
            }
        }
    }
}

class Week extends React.Component<{
    date: Date,
    startDate?: Date,
    endDate?: Date,
    contributions: IUserContributions,
    getWorkClass: (count: number) => string,
    toggleSelect: (startDate?: Date, endDate?: Date)  => void,
}, {}> {
    render() {
        const date = this.props.date;
        const days: JSX.Element[] = [];
        do {
            days.push(<Day
                date={new Date(date.getTime())}
                startDate={this.props.startDate}
                endDate={this.props.endDate}
                contributions={this.props.contributions[date.getTime()]}
                getWorkClass={this.props.getWorkClass}
                toggleSelect={this.props.toggleSelect}
            />);
            date.setDate(date.getDate() + 1);
        } while (date.getDay() > 0 && date < new Date());
        return <div className="week">{days}</div>;
    }
}

const monthNames: string[] = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
];

class Graph extends React.Component<{
    startDate?: Date,
    endDate?: Date,
    contributions: IUserContributions,
    loading: boolean,
    className?: string,
    toggleSelect: (startDate?: Date, endDate?: Date)  => void,
}, {}> {
    render() {
        const getWorkClass = getContributionClassDelegate(this.props.contributions);
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - date.getDay());

        const weeks: JSX.Element[] = [];
        const monthIdxes: number[] = [];
        for (let i = 0; i < 52; i++) {
            monthIdxes.push(date.getMonth());
            weeks.unshift(<Week
                date={new Date(date.getTime())}
                startDate={this.props.startDate}
                endDate={this.props.endDate}
                contributions={this.props.contributions}
                getWorkClass={getWorkClass}
                toggleSelect={this.props.toggleSelect}
            />)
            date.setDate(date.getDate() - 7);
        }
        return <div className={`graph ${this.props.className}`}>
            <div className="month-labels">
                {this.getMonths(monthIdxes)}
            </div>
            <div className="year">
                {weeks}
                {this.props.loading ? <Spinner className="graph-spinner" size={SpinnerSize.large} /> : null}
            </div>
        </div>;
    }
    /**
     * Create month labels of with appropriate widths and labels
     * @param monthIdxes in latest to oldest order => Months
     */
    private getMonths(monthIdxes: number[]): JSX.Element[] {
        interface IMonthCount { idx: number; count: number; }
        /** oldest to latest order of counts */
        const counts: IMonthCount[] = [];
        for (const idx of monthIdxes) {
            if (!counts[0] || counts[0].idx !== idx) {
                counts.unshift({idx, count: 1});
            } else {
                counts[0].count++;
            }
        }
        return counts.map(({idx, count}) =>
            <div className="month" style={{ flexGrow: count }}>
                {monthNames[idx]}
            </div>
        );
    }
}

export type TileSize = "small-tiles" | "medium-tiles";

let previousContributons: IUserContributions = {};
let renderNum = 0;
export function renderGraph(filter: IContributionFilter, toggleSelect: (startDate?: Date, endDate?: Date)  => void, tileSize: TileSize = "medium-tiles") {
    const graphParent = $(".graph-container")[0];
    const timings = new Timings();
    const currentRender = ++renderNum;
    /** Don't show the spinner all the time -- rendering the graph takes about 300 ms */
    const showSpinner = new DelayedFunction(null, 100, "showSpinner", () => {
        if (currentRender === renderNum) {
            ReactDOM.render(<Graph
                startDate={filter.startDate}
                endDate={filter.endDate}
                contributions={previousContributons}
                loading={true}
                toggleSelect={toggleSelect}
                className={tileSize}
            />, graphParent,
            () => {
                timings.measure("drawSpinner");
            });
        }
    });
    showSpinner.start();
    getContributions(filter).then(contributions => {
        showSpinner.cancel();
        if (currentRender === renderNum) {
            timings.measure("getContributions");
            previousContributons = contributions;
            ReactDOM.render(<Graph
                startDate={filter.startDate}
                endDate={filter.endDate}
                contributions={contributions}
                loading={false}
                className={tileSize}
                toggleSelect={toggleSelect}
            />, graphParent, () => {
                timings.measure("drawGraph");
                trackEvent("loadGraph", filterToIProperties(filter), timings.measurements);
            });
        }
    })
}
