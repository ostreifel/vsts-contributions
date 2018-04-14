import { IconButton } from "OfficeFabric/components/Button";
import * as React from "react";
import * as ReactDOM from "react-dom";

import { IUserContributions, UserContribution } from "../../data/contracts";
import { getContributions } from "../../data/provider";
import { IContributionFilter, ISelectedRange } from "../../filter";
import { clearSelectedDate } from "../filters";
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

interface ITimeWindowProps {
    selected?: ISelectedRange;
    allContributions: IUserContributions;
    filter: IContributionFilter;
}
class TimeWindow extends React.Component<ITimeWindowProps, {
    contributions: UserContribution[]
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
        return <div className="time-window">
            <div className="time-header">
                <h3>{this.getTitleText()}</h3>
                {
                    selected ?
                        <IconButton
                            iconProps={{ iconName: "ChromeClose" }}
                            title={"Clear date filter"}
                            onClick={() => clearSelectedDate()}
                        /> : null
                }
            </div>
            <SearchContributions
                contributionsKey={JSON.stringify(this.props.filter)}
                contributions={this.getContributions(this.props)}
                update={contributions => this.setState({contributions})}
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
        </div>;
    }
    private getTitleText() {
        const { selected } = this.props;
        const { contributions } = this.state;
        let title = toCountString(contributions.length, "contribution");
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
                contributions.push(...(allContributions[date.getTime()] || []));
            }
            return contributions;
        }
        const contributions: UserContribution[] = [];
        for (const day in allContributions) {
            contributions.push(...allContributions[day]);
        }
        contributions.sort((a, b) => a.date.getTime() - b.date.getTime());
        return contributions;
    }
}

let renderNum = 0;
export function renderTimeWindow(filter: IContributionFilter) {
    const graphParent = $(".time-window-container")[0];
    const currentRender = ++renderNum;
    getContributions(filter).then(contributions => {
        if (currentRender === renderNum) {
            ReactDOM.render(<TimeWindow filter={filter} selected={filter.selected} allContributions={contributions} />, graphParent);
        }
    });
}
