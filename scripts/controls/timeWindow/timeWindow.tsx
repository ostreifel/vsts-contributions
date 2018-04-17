import { IconButton } from "OfficeFabric/components/Button";
import * as React from "react";

import { IUserContributions, UserContribution } from "../../data/contracts";
import { ISelectedRange } from "../../filter";
import { isOneDayRange, toCountString, toDateString } from "../messageFormatting";
import {
    Changesets,
    ClosePullRequests,
    CloseWorkItems,
    Commits,
    CreatePullRequests,
    CreateWorkItems,
    ResolveWorkItems,
} from "./contributions";
import { SearchContributions } from "./search";
import { CollapsibleHeader } from "../CollapsibleHeader";

interface ITimeWindowProps {
    selected?: ISelectedRange;
    allContributions: IUserContributions;
    clearSelectedDate: () => void;
}
export class TimeWindow extends React.Component<ITimeWindowProps, {
    searchText?: string,
    contributions: UserContribution[],
}> {
    constructor(props: ITimeWindowProps) {
        super(props);
        this.state = { contributions: this.getContributions(props)};
    }
    componentWillReceiveProps(props: ITimeWindowProps) {
        this.setState({contributions: this.getContributions(props)});
    }
    render() {
        const { selected } = this.props;
        const { contributions } = this.state;
        const showDay = !selected || !isOneDayRange(selected);
        return <CollapsibleHeader
            title={this.getTitleText()}
            className="time-window"
            buttonName="contributions list"
            level={3}
            titleSuffix={
                selected ?
                    <IconButton
                        iconProps={{ iconName: "ChromeClose" }}
                        title={"Clear date filter"}
                        onClick={this.props.clearSelectedDate}
                    /> : undefined
            }
        >
            <SearchContributions
                contributionsKey={this.props.allContributions.key}
                contributions={this.getContributions(this.props)}
                searchText={this.state.searchText}
                update={(searchText, contributions) => this.setState({searchText, contributions})}
            />
            <div className="contribution-section">
                <Commits allContributions={contributions} showDay={showDay} />
                <Changesets allContributions={contributions} showDay={showDay} />
                <CreatePullRequests allContributions={contributions} showDay={showDay} />
                <ClosePullRequests allContributions={contributions} showDay={showDay} />
                <CreateWorkItems allContributions={contributions} showDay={showDay} />
                <ResolveWorkItems allContributions={contributions} showDay={showDay} />
                <CloseWorkItems allContributions={contributions} showDay={showDay} />
            </div>
        </CollapsibleHeader>;
    }
    private getTitleText() {
        const { selected } = this.props;
        const { contributions } = this.state;
        let title = "";
        if (this.state.searchText) {
            title += `'${this.state.searchText}' - `;
        }
        title += toCountString(contributions.length, "contribution");
        if (selected) {
            if (isOneDayRange(selected)) {
                title += ` on ${toDateString(selected.startDate)}`;
            } else {
                const displayedEndDate = new Date(selected.endDate.getTime());
                displayedEndDate.setDate(displayedEndDate.getDate() - 1);
                title += ` between ${toDateString(selected.startDate)} and ${toDateString(displayedEndDate)}`;
            }
        } else {
            title += " for the year";
        }
        return title;
    }
    private getContributions({selected, allContributions}: ITimeWindowProps) {
        if (selected) {
            const contributions: UserContribution[] = [];
            for (const date = new Date(selected.startDate.getTime()); date.getTime() < selected.endDate.getTime(); date.setDate(date.getDate() + 1)) {
                contributions.push(...(allContributions.data[date.getTime()] || []));
            }
            return contributions;
        }
        const contributions: UserContribution[] = [];
        for (const day in allContributions.data) {
            contributions.push(...allContributions.data[day]);
        }
        contributions.sort((a, b) => a.date.getTime() - b.date.getTime());
        return contributions;
    }
}
