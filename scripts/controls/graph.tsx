import { FocusZone, FocusZoneDirection } from "OfficeFabric/components/FocusZone";
import { Spinner, SpinnerSize } from "OfficeFabric/components/Spinner";
import * as React from "react";

import { IUserContributions } from "../data/contracts";
import { ISelectedRange } from "../filter";
import { Day } from "./Day";
import { ToggleSelected } from "./showGraphs";

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
    };
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
export class Graph extends React.Component<{
    selected?: ISelectedRange,
    contributions: IUserContributions,
    loading: boolean,
    className?: string,
    toggleSelect: ToggleSelected,
}, {}> {
    render() {
        const getWorkClass = getContributionClassDelegate(this.props.contributions);
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - date.getDay());

        const weeks: JSX.Element[][] = [];
        const monthIdxes: number[] = [];
        for (let i = 0; i < 52; i++) {
            monthIdxes.push(date.getMonth());
            weeks.unshift(this.getWeek(new Date(date.getTime()), getWorkClass));
            date.setDate(date.getDate() - 7);
        }

        return <div className={`graph ${this.props.className}`}>
            <div className="month-labels">
                {this.getMonths(monthIdxes)}
            </div>
            <FocusZone
                className="year"
                direction={FocusZoneDirection.bidirectional}
            >
                {this.getDays(weeks)}
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

    private getWeek(date: Date, getWorkClass: (count: number) => string): JSX.Element[] {
        const days: JSX.Element[] = [];
        const identity = this.props.contributions.user.uniqueName;
        const toggleSelect = (date?: Date, expand?: boolean) => this.props.toggleSelect(identity, date, expand);
        do {
            days.push(<Day
                date={new Date(date.getTime())}
                selected={this.props.selected}
                contributions={this.props.contributions.data[date.getTime()]}
                getWorkClass={getWorkClass}
                toggleSelect={toggleSelect}
            />);
            date.setDate(date.getDate() + 1);
        } while (date.getDay() > 0 && date < new Date());

        // need these placeholders to take up space for row wrap to work
        while (days.length < 7) {
            days.push(<div className="day-container placeholder" />);
        }
        return days;
    }
    /** FocusZone cannot handle flex column wrap so rotate the days and use row wrap*/
    private getDays(weeks: JSX.Element[][]): JSX.Element[] {
        const days: JSX.Element[] = [];
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 52; j++) {
                days.push(weeks[j][i]);
            }
        }
        return days;
    }
}
