import * as React from "react";
import * as ReactDOM from "react-dom";
import { getContributions } from "../../data/provider";
import { toDateString, toCountString, isOneDayRange } from "../messageFormatting";
import {
    IUserContributions,
    UserContribution,
} from "../../data/contracts";
import { IContributionFilter } from "../../filter";
import { IconButton } from "OfficeFabric/components/Button";
import { updateSelectedDate } from "../filters";

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
    startDate?: Date;
    endDate?: Date;
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
        const { startDate, endDate } = this.props;
        const { contributions } = this.state;
        const showDay = !startDate || !endDate || !isOneDayRange(startDate, endDate);
        return <div className="time-window">
            <div className="time-header">
                <h3>{this.getTitleText()}</h3>
                {
                    startDate ?
                        <IconButton
                            iconProps={{ iconName: "ChromeClose" }}
                            title={"Clear date filter"}
                            onClick={() => updateSelectedDate()}
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
        const { startDate, endDate } = this.props;
        const { contributions } = this.state;
        let title = toCountString(contributions.length, "contribution");
        if (startDate && endDate) {
            if (isOneDayRange(startDate, endDate)) {
                title += ` on ${toDateString(startDate)}`;
            } else {
                const displayedEndDate = new Date(endDate as any);
                displayedEndDate.setDate(displayedEndDate.getDate() - 1);
                title += ` between ${toDateString(startDate)} and ${toDateString(displayedEndDate)}`;
            }
        } else {
            title += " for the year";
        }
        return title;
    }
    private getContributions({startDate, endDate, allContributions}: ITimeWindowProps) {
        if (startDate && endDate) {
            const contributions: UserContribution[] = [];
            for (const date = new Date(startDate as any); date.getTime() < endDate.getTime(); date.setDate(date.getDate() + 1)) {
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
            const { startDate, endDate } = filter;
            ReactDOM.render(<TimeWindow filter={filter} startDate={startDate} endDate={endDate} allContributions={contributions} />, graphParent);
        }
    });
}
