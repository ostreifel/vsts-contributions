import * as React from "react";
import * as ReactDOM from "react-dom";
import { Callout } from "OfficeFabric/components/Callout";
import { getContributions } from "../data/provider";
import { IUserContributions, UserContribution } from "../data/contracts";
import { toDateString, toCountString, isOneDayRange } from "./messageFormatting";
import { Spinner, SpinnerSize } from "OfficeFabric/components/Spinner";
import { trackEvent } from "../events";
import { Timings } from "../timings";
import { IContributionFilter, filterToIProperties } from "../filter"
import { DelayedFunction } from "VSS/Utils/Core"
import { FocusZone } from "OfficeFabric/components/FocusZone";
import { KeyCodes } from "OfficeFabric/Utilities";

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
    toggleSelect: (date?: Date, expand?: boolean) => void,
    date: Date,
    startDate?: Date,
    endDate?: Date,
    contributions?: UserContribution[],
    getWorkClass: (count: number) => string
},
    { showCallout: boolean }
> {
    constructor() {
        super();
        this.state = { showCallout: false };
    }
    render() {
        const contributions = this.props.contributions || [];
        const dayId = `day_${this.props.date.getTime()}`;
        return <div className="day-container"
            onMouseEnter={() => this.delayedShowCallout()}
            onMouseOver={() => this.delayedShowCallout()}
            onMouseLeave={() => this.delayedShowCallout(false)}
            onMouseDown={this.onClick.bind(this)}
            onKeyDown={this.onKeydown.bind(this)}
            tabIndex={0}
            data-is-focusable={true}
        >
            <div className={`day ${this.props.getWorkClass(contributions.length)}`} id={dayId}></div>
            <div className={this.getDayFilterClasses()} />
            {this.state.showCallout ?
                <Callout
                    target={`#${dayId}`}
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
    private readonly showCalloutDelay = new DelayedFunction(null, 200, "", () => this.showCalloutNow(true));
    private delayedShowCallout(show: boolean = true) {
        if (show) {
            this.showCalloutDelay.reset();
        } else {
            this.showCalloutDelay.cancel();
            this.showCalloutNow(false);
        }
    }
    private showCalloutNow(show: boolean = true) {
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
    /** can't rely on synthetic events b/c they don't have the shift flag set */
    private onKeydown(e: KeyboardEvent) {
        if (e.keyCode === KeyCodes.space || e.keyCode === KeyCodes.enter) {
            this.toggleSelect(e.shiftKey);
            e.stopPropagation();
            e.preventDefault();
        }
    }
    private onClick(e: MouseEvent) {
        this.toggleSelect(e.shiftKey);
    }
    private toggleSelect(expand: boolean) {
        if (expand) {
            this.props.toggleSelect(this.props.date, true);
        } else {
            if (this.isSelected()) {
                this.props.toggleSelect();
                if (
                    this.props.startDate &&
                    this.props.endDate &&
                    !isOneDayRange(this.props.startDate, this.props.endDate)
                ) {
                    this.props.toggleSelect(this.props.date);
                }
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
    toggleSelect: (date?: Date, expand?: boolean)  => void,
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
    toggleSelect: (date?: Date, expand?: boolean)  => void,
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
            <FocusZone className="year">
                {weeks}
                {this.props.loading ? <Spinner className="graph-spinner" size={SpinnerSize.large} /> : null}
            </FocusZone>
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
export function renderGraph(filter: IContributionFilter, toggleSelect: (date?: Date, expand?: boolean)  => void, tileSize: TileSize = "medium-tiles") {
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
