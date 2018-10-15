import * as React from "react";
import { KeyCodes } from "office-ui-fabric-react/lib-amd/Utilities";
import { FocusZone, FocusZoneDirection } from "office-ui-fabric-react/lib-amd/components/FocusZone";
import { toTimeString } from "../messageFormatting";
import { HostNavigationService } from "VSS/SDK/Services/Navigation";
import {
    CommitContribution,
    PullRequestContribution,
    WorkItemContribution,
    ChangesetContribution,
} from "../../data/contracts";

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
        const { title, titleUrl, location, locationUrl, date, showDay, className } = this.props;
        return <div className={`contribution-item ${className}`}
            tabIndex={0}
            data-is-focusable={true}
            onKeyDown={this._onKeyDown.bind(this)}
            onDoubleClick={this._openLink.bind(this)}
            aria-label={this.props.title}
        >
            <FocusZone direction={FocusZoneDirection.horizontal}>
                <a className="title" href={titleUrl} target="_blank" onClick={this._onClick(titleUrl)}>{title}</a>
                <div className="location-time">
                    {" in "}
                    <a className="location" href={locationUrl} target="_blank" onClick={this._onClick(locationUrl)}>{location}</a>
                    {` ${showDay ? "on" : "at"} ${toTimeString(date, showDay)}`}
                </div>
            </FocusZone>
        </div>;
    }

    private _onClick(url: string) {
        return async (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            e.stopPropagation();
            const service = await VSS.getService(VSS.ServiceIds.Navigation) as HostNavigationService;
            service.openNewWindow(url, "");
        };
    }

    private _onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.keyCode === KeyCodes.space || e.keyCode === KeyCodes.enter) {
            this._openLink();
        }
    }
    private _openLink() {
        VSS.getService(VSS.ServiceIds.Navigation).then((navigationService: HostNavigationService) => {
            navigationService.openNewWindow(this.props.titleUrl, "");
        });
    }
}

export class Changeset extends React.Component<{ changeset: ChangesetContribution, showDay: boolean }, {}> {
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

export class Commit extends React.Component<{ commit: CommitContribution, showDay: boolean }, {}> {
    render() {
        const { repo, commit } = this.props.commit;
        const { showDay } = this.props;
        return <ContributionItem
            title={commit.comment}
            titleUrl={commit.remoteUrl}
            location={repo.name}
            locationUrl={repo.remoteUrl}
            showDay={showDay}
            date={new Date(commit.author.date as any)}
            className="commit"
        />;
    }
}

export class PullRequest extends React.Component<{ pullrequest: PullRequestContribution, showDay: boolean }, {}> {
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

export class WorkItemComponent extends React.Component<{ workItem: WorkItemContribution, showDay: boolean }, {}> {
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
