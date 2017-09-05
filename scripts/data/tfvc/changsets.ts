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
import { projects } from "../projects";

const changesets: {[user: string]: {[project: string]: CachedValue<TfvcChangesetRef[]>}} = {};

const batchSize = 100;
const batchCount= 6;
function getChangeSets(username: string, project: string, skip: number = 0): Q.IPromise<TfvcChangesetRef[]> {
    const promises: Q.IPromise<TfvcChangesetRef[]>[] = [];
    for (let i = 0; i < batchCount; i++) {
        promises.push(getClient().getChangesets(project, undefined, skip + batchSize * i, batchSize));
    }
    return Q.all(promises).then(
        (changesetsArr) => {
            const changesets: TfvcChangesetRef[] = [];
            for (const arr of changesetsArr) {
                changesets.push(...arr);
            }
            if (changesets.length < batchCount * batchSize) {
                return changesets;
            }
            return getChangeSets(username, project, skip + batchCount * batchSize).then(
                (moreChangesets) => {
                    return [...changesets, ...moreChangesets];
                }
            );
        },
        (error: TfsError) => {
            if (Number(error.status) === 404) {
                return [];
            }
        return Q.reject(error)
    });
}
export class ChangsetContributionProvider implements IContributionProvider {
    public readonly name: ContributionName = "Changeset";
    public getContributions({ identity, allProjects }: IContributionFilter): Q.IPromise<ChangesetContribution[]> {
        const username = identity.uniqueName || identity.displayName;
        const projectsPromise: Q.IPromise<string[]> = allProjects ?
            projects.getValue().then(projects => projects.map(p => p.name))
            : Q([VSS.getWebContext().project.name]);
        return projectsPromise.then((projects): Q.IPromise<ChangesetContribution[]> => {
            if (!(username in changesets)) {
                changesets[username] = {}
            }
            for (const project of projects) {
                if (!(project in changesets[username])) {
                    changesets[username][project] = new CachedValue(() => getChangeSets(username, project));
                }
            }
            return Q.all(projects.map((p) =>
                changesets[username][p].getValue().then(
                    (changesets) => changesets.map(c => new ChangesetContribution(c, p))
                ))).then((changesetsArr): ChangesetContribution[] => {
                const changesets: ChangesetContribution[] = [];
                for (const arr of changesetsArr) {
                    changesets.push(...arr);
                }
                return changesets;
            });
        });
    }
}
