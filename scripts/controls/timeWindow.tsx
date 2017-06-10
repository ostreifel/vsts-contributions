import * as React from "react";
import * as ReactDOM from "react-dom";
import { getContributions } from "../data/provider";
import { dateToString, toCountString } from "./messageFormatting";
import { IUserContributions, UserContribution, RepoCommit } from "../data/contracts";

class Commit extends React.Component<{commit: RepoCommit}, {}> {
    render() {
        const { repo, commit } = this.props.commit;
        return <div>{`${commit.comment}`}</div>;
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
        return <Contributions title={toCountString(commits.length, "commit")}>
            {commits.map(c => <Commit commit={c}/>)}
        </Contributions>;
    }
}

class Contributions extends React.Component<{ title: string }, {}> {
    render() {
        return <div>
            <h4>{this.props.title}</h4>
            <div>{this.props.children}</div>
        </div>
    }
}

class TimeWindow extends React.Component<{ date?: Date, allContributions: IUserContributions }, {}> {
    render() {
        const { date } = this.props;
        const contributions = this.getContributions();
        return <div className="time-window">
            <h3>{`${toCountString(contributions.length, "contribution")} ${date ? ` on ${dateToString(date)}` : " for the year"}`}</h3>
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

export function renderTimeWindow(date?: Date) {
    const graphParent = $(".time-window-container")[0];
    getContributions().then(contributions => {
        if (date) {
            const end = new Date(date);
            end.setDate(end.getDate() + 1);
        }
        ReactDOM.render(<TimeWindow date={date} allContributions={contributions} />, graphParent);
    });
}
