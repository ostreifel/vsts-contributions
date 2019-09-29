import * as React from "react";
import { Commit, PullRequest, WorkItemComponent, Changeset } from "./contribution";
import { List } from "office-ui-fabric-react/lib-amd/components/List";
import { FocusZone, FocusZoneDirection } from "office-ui-fabric-react/lib-amd/components/FocusZone";
import { CollapsibleHeader } from "../CollapsibleHeader";
import {
    UserContribution,
    CommitContribution,
    CreatePullRequestContribution,
    ClosePullRequestContribution,
    CreateWorkItemContribution,
    ResolveWorkItemContribution,
    CloseWorkItemContribution,
    ChangesetContribution,
    ReviewPullRequestContribution,
} from "../../data/contracts";

export class Commits extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        return <Contributions
            noun={"Created # commit"}
            items={this.props.allContributions.filter(c => c instanceof CommitContribution)}
            onRenderItem={(commit: CommitContribution) => <Commit commit={commit} showDay={this.props.showDay} />}
        />;
    }
}

export class CreatePullRequests extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        return <Contributions
            noun={"Created # pull request"}
            items={this.props.allContributions.filter(c => c instanceof CreatePullRequestContribution)}
            onRenderItem={(pr: CreatePullRequestContribution) => <PullRequest pullrequest={pr} showDay={this.props.showDay} />}
        />;
    }
}

export class ClosePullRequests extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        return <Contributions
            noun={"Closed # pull request"}
            items={this.props.allContributions.filter(c => c instanceof ClosePullRequestContribution)}
            onRenderItem={(pr: ClosePullRequestContribution) => <PullRequest pullrequest={pr} showDay={this.props.showDay} />}
        />;
    }
}

export class ReviewPullRequests extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        return <Contributions
            noun={"Reviewed # pull request"}
            items={this.props.allContributions.filter(c => c instanceof ReviewPullRequestContribution)}
            onRenderItem={(pr: ReviewPullRequestContribution) => <PullRequest pullrequest={pr} showDay={this.props.showDay} />}
        />;
    }
}

export class CreateWorkItems extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        return <Contributions
            noun={"Created # work item"}
            items={this.props.allContributions.filter(c => c instanceof CreateWorkItemContribution)}
            onRenderItem={(wi: CreateWorkItemContribution) => <WorkItemComponent workItem={wi} showDay={this.props.showDay} />}
        />;
    }
}

export class ResolveWorkItems extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        return <Contributions
            noun={"Resolved # work item"}
            items={this.props.allContributions.filter(c => c instanceof ResolveWorkItemContribution)}
            onRenderItem={(wi: ResolveWorkItemContribution) => <WorkItemComponent workItem={wi} showDay={this.props.showDay} />}
        />;
    }
}

export class CloseWorkItems extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        return <Contributions
            noun={"Closed # work item"}
            items={this.props.allContributions.filter(c => c instanceof CloseWorkItemContribution)}
            onRenderItem={(wi: CloseWorkItemContribution) => <WorkItemComponent workItem={wi} showDay={this.props.showDay} />}
        />;
    }
}

export class Changesets extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        return <Contributions
            noun={"Created # changeset"}
            items={this.props.allContributions.filter(c => c instanceof ChangesetContribution)}
            onRenderItem={(c: ChangesetContribution) => <Changeset changeset={c} showDay={this.props.showDay} />}
        />;
    }
}

class Contributions<T> extends React.Component<{
    noun: string,
    items: T[],
    onRenderItem: (item: T, index: number) => React.ReactNode;
}, {
    showChildren: boolean,
}> {
    render() {
        let { noun } = this.props;
        const count = this.props.items.length;
        const label = count === 1 ? noun : noun + "s";
        const title = label.match(/#/) ? label.replace('#', "" + count) : count + " " + label;
        return <CollapsibleHeader title={title} buttonName={label.replace("# ", "").toLocaleLowerCase()} className={count === 0 ? "hidden" : ""} level={4}>
            <FocusZone direction={FocusZoneDirection.vertical} >
                <List
                    items={this.props.items}
                    onRenderCell={this.props.onRenderItem}
                />
            </FocusZone>
        </CollapsibleHeader>;
    }
}
