import * as React from "react";
import * as ReactDOM from "react-dom";
import { getContributions } from "../data/provider";
import { toDateString, toTimeString, toCountString } from "./messageFormatting";
import {
    IUserContributions,
    UserContribution,
    CommitContribution,
    IContributionFilter,
    PullRequestContribution,
    CreatePullRequestContribution,
    ClosePullRequestContribution,
} from "../data/contracts";
import { CollapsibleHeader } from "./header";



class Commit extends React.Component<{ commit: CommitContribution, showDay: boolean }, {}> {
    render() {
        const { repo, commit } = this.props.commit;
        return <div className="commit">
            <a className="title" href={commit.remoteUrl} target="_blank">{`${commit.comment}`}</a>
            {" in "}
            <a className="repository" href={repo.remoteUrl} target="_blank">{repo.name}</a>
            {` at ${toTimeString(commit.author.date, this.props.showDay)}`}
        </div>;
    }
}

class Commits extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        const commits: CommitContribution[] = [];
        for (const contribution of this.props.allContributions) {
            if (contribution instanceof CommitContribution) {
                commits.push(contribution);
            }
        }
        return <Contributions count={commits.length} noun={"commit"}>
            {commits.map(c => <Commit commit={c} showDay={this.props.showDay} />)}
        </Contributions>;
    }
}

class PullRequest extends React.Component<{ pullrequest: PullRequestContribution, showDay: boolean }, {}> {
    render() {
        const { date, pullrequest } = this.props.pullrequest;
        const { title, repository } = pullrequest;

        const uri = VSS.getWebContext().host.uri;
        const project = repository.project.name;
        const prUrl = `${uri}${project}/_git/${repository.name}/pullrequest/${pullrequest.pullRequestId}`;
        const repoUrl = `${uri}_git/${repository.name}`;
        return <div className="commit">
            <a className="title" href={prUrl} target="_blank">{`${title}`}</a>
            {" in "}
            <a className="repository" href={repoUrl} target="_blank">{repository.name}</a>
            {` at ${toTimeString(date, this.props.showDay)}`}
        </div>;
    }
}

class CreatePullRequests extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        const prs: CreatePullRequestContribution[] = [];
        for (const contribution of this.props.allContributions) {
            if (contribution instanceof CreatePullRequestContribution) {
                prs.push(contribution);
            }
        }
        return <Contributions count={prs.length} noun={"created pull request"}>
            {prs.map(pr => <PullRequest pullrequest={pr} showDay={this.props.showDay} />)}
        </Contributions>;
    }
}

class ClosePullRequests extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        const prs: ClosePullRequestContribution[] = [];
        for (const contribution of this.props.allContributions) {
            if (contribution instanceof ClosePullRequestContribution) {
                prs.push(contribution);
            }
        }
        return <Contributions count={prs.length} noun={"closed pull request"}>
            {prs.map(pr => <PullRequest pullrequest={pr} showDay={this.props.showDay} />)}
        </Contributions>;
    }
}

class Contributions extends React.Component<{ count: number, noun: string }, { showChildren: boolean }> {
    render() {
        const { count, noun } = this.props;
        const label = count === 1 ? noun : noun + "s";
        return <CollapsibleHeader title={toCountString(count, noun)} name={label} className={count === 0 ? "hidden" : ""}>
            {this.props.children}
        </CollapsibleHeader>;
    }
}

class TimeWindow extends React.Component<{ date?: Date, allContributions: IUserContributions }, {}> {
    render() {
        const { date } = this.props;
        const contributions = this.getContributions();
        const showDay = !date;
        return <div className="time-window">
            <h3>{`${toCountString(contributions.length, "contribution")} ${date ? ` on ${toDateString(date)}` : " for the year"}`}</h3>
            <div>
                <Commits allContributions={contributions} showDay={showDay} />
                <CreatePullRequests allContributions={contributions} showDay={showDay} />
                <ClosePullRequests allContributions={contributions} showDay={showDay} />
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
