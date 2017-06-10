import * as React from "react";
import * as ReactDOM from "react-dom";
import { IconButton } from "OfficeFabric/components/Button";
import { getContributions } from "../data/provider";
import { toDateString, toCountString } from "./messageFormatting";
import { IUserContributions, UserContribution, RepoCommit, IContributionFilter } from "../data/contracts";

class Commit extends React.Component<{ commit: RepoCommit }, {}> {
    render() {
        const { repo, commit } = this.props.commit;
        return <div className="commit">
            <a className="title" href={commit.remoteUrl} target="_blank">{`${commit.comment}`}</a>
            {" in "}
            <a className="repository" href={repo.remoteUrl} target="_blank">{repo.name}</a>
            {` at ${commit.author.date.toLocaleTimeString()}`}
        </div>;
    }
}

class Commits extends React.Component<{ allContributions: UserContribution[] }, {}> {
    render() {
        const commits: RepoCommit[] = [];
        for (const contribution of this.props.allContributions) {
            if (contribution instanceof RepoCommit) {
                commits.push(contribution);
            }
        }
        return <Contributions count={commits.length} noun={"commit"}>
            {commits.map(c => <Commit commit={c} />)}
        </Contributions>;
    }
}

class Contributions extends React.Component<{ count: number, noun: string }, { showChildren: boolean }> {
    constructor() {
        super();
        this.state = { showChildren: false };
    }
    render() {
        const { count, noun } = this.props;
        const { showChildren } = this.state;
        const label = count === 1 ? noun : noun + "s";
        return <div>
            <div className="contribution-type-header">
                <IconButton
                    className="toggle-button"
                    iconProps={{ iconName: showChildren ? 'ChevronDownSmall' : "ChevronRightSmall" }}
                    title={`${showChildren ? "Hide" : "Show"} ${label}`}
                    onClick={() => this.setState({ showChildren: !this.state.showChildren })}
                />
                <h4>{toCountString(this.props.count, this.props.noun)}</h4>
            </div>
            {showChildren ?
                <div>{this.props.children}</div>
                : null
            }
        </div>
    }
}

class TimeWindow extends React.Component<{ date?: Date, allContributions: IUserContributions }, {}> {
    render() {
        const { date } = this.props;
        const contributions = this.getContributions();
        return <div className="time-window">
            <h3>{`${toCountString(contributions.length, "contribution")} ${date ? ` on ${toDateString(date)}` : " for the year"}`}</h3>
            <div>
                <Commits allContributions={contributions} />
            </div>
        </div>;
    }
    private getContributions() {
        const { date, allContributions } = this.props;
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

export function renderTimeWindow(filter: IContributionFilter) {
    const graphParent = $(".time-window-container")[0];
    getContributions(filter).then(contributions => {
        const date = filter.selectedDate;
        if (date) {
            const end = new Date(date);
            end.setDate(end.getDate() + 1);
        }
        ReactDOM.render(<TimeWindow date={date} allContributions={contributions} />, graphParent);
    });
}
