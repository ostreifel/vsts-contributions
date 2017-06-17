import { TfvcChangesetRef } from "TFS/VersionControl/Contracts";
import { getClient } from "TFS/VersionControl/TfvcRestClient";
import { IContributionFilter } from "../../filter";
import {
    ChangesetContribution,
    IContributionProvider,
    ContributionName,
} from "../contracts";
import * as Q from "q";
import { CachedValue } from "../CachedValue";
import { projects } from "./projects";

const changesets: {[user: string]: {[project: string]: CachedValue<any[]>}} = {};

function getChangeSets(username: string, project: string, skip: number = 0): Q.IPromise<TfvcChangesetRef[]> {
    return getClient().getChangesets(project, undefined, skip, 100).then(changesets => {
        if (changesets.length < 100) {
            return changesets;
        }
        return getChangeSets(username, project, skip + 100).then(moreChangsets => [...changesets, ...moreChangsets]);
    });

}
export class ChangsetContributionProvider implements IContributionProvider {
    public readonly name: ContributionName = "Changeset";
    public getContributions({ identity, allProjects }: IContributionFilter): Q.IPromise<ChangesetContribution[]> {
        const username = identity.uniqueName || identity.displayName;
        const projectsPromise: Q.IPromise<string[]> = allProjects ?
            projects.getValue().then(projects => projects.map(p => p.name))
            : Q([VSS.getWebContext().project.name]);
        return projectsPromise.then(projects => {
            if (!(username in changesets)) {
                changesets[username] = {}
            }
            for (const project in projects) {
                changesets[username][project] = new CachedValue(() => getChangeSets(username, project));
            }
            return Q.all(projects.map(p => changesets[username][p].getValue())).then(changesetsArr => {
                const changesets: TfvcChangesetRef[] = [];
                for (const arr of changesetsArr) {
                    changesets.push(...arr);
                }
                return changesets.map(c => new ChangesetContribution(c));
            });
        });
    }
}
