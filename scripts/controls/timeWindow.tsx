import * as React from "react";
import * as ReactDOM from "react-dom";
import { getContributions } from "../data/provider";
import { toDateString, toTimeString, toCountString } from "./messageFormatting";
import {
    IUserContributions,
    UserContribution,
    CommitContribution,
    PullRequestContribution,
    CreatePullRequestContribution,
    ClosePullRequestContribution,
    WorkItemContribution,
    CreateWorkItemContribution,
    ResolveWorkItemContribution,
    CloseWorkItemContribution,
    ChangesetContribution,
} from "../data/contracts";
import { CollapsibleHeader } from "./CollapsibleHeader";
import { IContributionFilter } from "../filter";


class ContributionItem extends React.Component<{
    title: string,
    titleUrl: string,
    location: string,
    locationUrl: string;
    date: Date
    showDay: boolean,
    className?: string;
}, {}> {
    render() {
        const { title, titleUrl, location, locationUrl, date, showDay, className } = this.props
        return <div className={`contribution-item ${className}`} >
            <a className="title" href={titleUrl} target="_blank">{title}</a>
            <div className="location-time">
                {" in "}
                <a className="location" href={locationUrl} target="_blank">{location}</a>
                {` ${showDay ? "on" : "at"} ${toTimeString(date, showDay)}`}
            </div>
        </div>;
    }

}

class Changeset extends React.Component<{ changeset: ChangesetContribution, showDay: boolean }, {}> {
    render() {
        const { showDay } = this.props;
        const { changeset, date, projectName } = this.props.changeset;

        const collectionUri = VSS.getWebContext().collection.uri;
        const changesetUrl = `${collectionUri}${projectName}/_versionControl/changeset/${changeset.changesetId}`;
        const repoUrl = `${collectionUri}${projectName}/_versionControl`;
        return <ContributionItem
            title={changeset.comment || `Changeset ${changeset.changesetId}`}
            titleUrl={changesetUrl}
            location={projectName}
            locationUrl={repoUrl}
            date={date}
            className={"changeset"}
            showDay={showDay}
        />;
    }
}

class Commit extends React.Component<{ commit: CommitContribution, showDay: boolean }, {}> {
    render() {
        const { repo, commit } = this.props.commit;
        const { showDay } = this.props;
        return <ContributionItem
            title={commit.comment}
            titleUrl={commit.remoteUrl}
            location={repo.name}
            locationUrl={repo.remoteUrl}
            showDay={showDay}
            date={new Date(commit.author.date)}
            className="commit"
        />;
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
        return <Contributions count={commits.length} noun={"Created # commit"}>
            {commits.map(c => <Commit commit={c} showDay={this.props.showDay} />)}
        </Contributions>;
    }
}

class PullRequest extends React.Component<{ pullrequest: PullRequestContribution, showDay: boolean }, {}> {
    render() {
        const { date, pullrequest } = this.props.pullrequest;
        const { title, repository } = pullrequest;
        const { showDay } = this.props;

        const uri = VSS.getWebContext().host.uri;
        const project = repository.project.name;
        const prUrl = `${uri}${project}/_git/${repository.name}/pullrequest/${pullrequest.pullRequestId}`;
        const repoUrl = `${uri}${project}/_git/${repository.name}`;
        return <ContributionItem
            title={title}
            titleUrl={prUrl}
            location={repository.name}
            locationUrl={repoUrl}
            showDay={showDay}
            date={date}
            className="commit"
        />;
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
        return <Contributions count={prs.length} noun={"Created # pull request"}>
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
        return <Contributions count={prs.length} noun={"Closed # pull request"}>
            {prs.map(pr => <PullRequest pullrequest={pr} showDay={this.props.showDay} />)}
        </Contributions>;
    }
}

class WorkItemComponent extends React.Component<{ workItem: WorkItemContribution, showDay: boolean }, {}> {
    render() {
        const { date, wi } = this.props.workItem;
        const { showDay } = this.props;
        const uri = VSS.getWebContext().host.uri;
        const project = wi.fields["System.TeamProject"];
        const wiUrl = `${uri}${project}/_workitems?id=${wi.id}&_a=edit&fullScreen=true`;
        const title = wi.fields["System.Title"] || `${wi.fields["System.WorkItemType"]} ${wi.id}`;
        return <ContributionItem
            title={title}
            titleUrl={wiUrl}
            location={project}
            locationUrl={`${uri}${project}`}
            showDay={showDay}
            date={date}
            className="commit"
        />;
    }
}

class CreateWorkItems extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        const workitems: CreateWorkItemContribution[] = [];
        for (const contribution of this.props.allContributions) {
            if (contribution instanceof CreateWorkItemContribution) {
                workitems.push(contribution);
            }
        }
        return <Contributions count={workitems.length} noun={"Created # work item"}>
            {workitems.map(wi => <WorkItemComponent workItem={wi} showDay={this.props.showDay} />)}
        </Contributions>;
    }
}

class ResolveWorkItems extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        const workitems: ResolveWorkItemContribution[] = [];
        for (const contribution of this.props.allContributions) {
            if (contribution instanceof ResolveWorkItemContribution) {
                workitems.push(contribution);
            }
        }
        return <Contributions count={workitems.length} noun={"Resolved # work item"}>
            {workitems.map(wi => <WorkItemComponent workItem={wi} showDay={this.props.showDay} />)}
        </Contributions>;
    }
}

class CloseWorkItems extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        const changesets: CloseWorkItemContribution[] = [];
        for (const contribution of this.props.allContributions) {
            if (contribution instanceof CloseWorkItemContribution) {
                changesets.push(contribution);
            }
        }
        return <Contributions count={changesets.length} noun={"Closed # work item"}>
            {changesets.map(wi => <WorkItemComponent workItem={wi} showDay={this.props.showDay} />)}
        </Contributions>;
    }
}

class Changesets extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        const changesets: ChangesetContribution[] = [];
        for (const contribution of this.props.allContributions) {
            if (contribution instanceof ChangesetContribution) {
                changesets.push(contribution);
            }
        }
        return <Contributions count={changesets.length} noun={"Created # changeset"}>
            {changesets.map(changeset => <Changeset changeset={changeset} showDay={this.props.showDay} />)}
        </Contributions>;
    }
}

class Contributions extends React.Component<{ count: number, noun: string }, { showChildren: boolean }> {
    render() {
        const { count, noun } = this.props;
        const label = count === 1 ? noun : noun + "s";
        const title = label.match(/#/) ? label.replace('#', "" + count) : count + " " + label;
        return <CollapsibleHeader title={title} name={label.replace("# ", "").toLocaleLowerCase()} className={count === 0 ? "hidden" : ""}>
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
                <Changesets allContributions={contributions} showDay={showDay} />
                <CreatePullRequests allContributions={contributions} showDay={showDay} />
                <ClosePullRequests allContributions={contributions} showDay={showDay} />
                <CreateWorkItems allContributions={contributions} showDay={showDay} />
                <ResolveWorkItems allContributions={contributions} showDay={showDay} />
                <CloseWorkItems allContributions={contributions} showDay={showDay} />
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
            ReactDOM.render(<TimeWindow date={date} allContributions={contributions} />, graphParent);
        }
    });
}
