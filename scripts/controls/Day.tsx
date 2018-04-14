import { Callout } from "OfficeFabric/components/Callout";
import { KeyCodes } from "OfficeFabric/Utilities";
import * as React from "react";
import { DelayedFunction } from "VSS/Utils/Core";

import { UserContribution } from "../data/contracts";
import { ISelectedRange } from "../filter";
import { isOneDayRange, toCountString, toDateString } from "./messageFormatting";

export class Day extends React.Component<{
    toggleSelect: (date?: Date, expand?: boolean) => void,
    date: Date,
    selected?: ISelectedRange,
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
        const contributionCount = toCountString(contributions.length, "contribution");
        const dateString = toDateString(this.props.date);
        return <div className="day-container"
            onMouseEnter={() => this.delayedShowCallout()}
            onMouseOver={() => this.delayedShowCallout()}
            onMouseLeave={() => this.delayedShowCallout(false)}
            onMouseDown={this.onClick.bind(this)}
            onKeyDown={this.onKeydown.bind(this)}
            tabIndex={0}
            data-is-focusable={true}
            aria-label={`${contributionCount} on ${dateString}`}
        >
            <div className={`day ${this.props.getWorkClass(contributions.length)}`} id={dayId}></div>
            <div className={this.getDayFilterClasses()} />
            {this.state.showCallout ?
                <Callout
                    target={`#${dayId}`}
                >
                    <div>{contributionCount}</div>
                    <div>{dateString}</div>
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
        if (!this.props.selected) {
            return false;
        }
        const {date} = this.props;
        const {startDate, endDate} = this.props.selected;
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
                    this.props.selected &&
                    !isOneDayRange(this.props.selected)
                ) {
                    this.props.toggleSelect(this.props.date);
                }
            } else {
                this.props.toggleSelect(this.props.date);
            }
        }
    }
}
