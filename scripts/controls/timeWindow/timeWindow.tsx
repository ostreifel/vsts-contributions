import * as React from "react";
import * as ReactDOM from "react-dom";
import { getContributions } from "../../data/provider";
import { toDateString, toCountString } from "../messageFormatting";
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
    date?: Date,
    allContributions: IUserContributions,
    filter: IContributionFilter,
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
        const { date } = this.props;
        const { contributions } = this.state;
        const showDay = !date;
        return <div className="time-window">
            <div className="time-header">
                <h3>{`${toCountString(contributions.length, "contribution")} ${date ? ` on ${toDateString(date)}` : " for the year"}`}</h3>
                {
                    date ?
                        <IconButton
                            icon={"ChromeClose"}
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
    private getContributions({date, allContributions}: ITimeWindowProps) {
        if (date) {
            return allContributions[date.getTime()] || [];
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
            const date = filter.selectedDate;
            if (date) {
                const end = new Date(date);
                end.setDate(end.getDate() + 1);
            }
            ReactDOM.render(<TimeWindow filter={filter} date={date} allContributions={contributions} />, graphParent);
        }
    });
}
