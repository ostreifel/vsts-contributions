import { TfvcChangesetRef, TfvcChangesetSearchCriteria } from "TFS/VersionControl/Contracts";
import { getClient } from "TFS/VersionControl/TfvcRestClient";
import { IContributionFilter } from "../../filter";
import {
    ChangesetContribution,
    IContributionProvider,
    ContributionName,
} from "../contracts";
import { projectsVal } from "../projects";

const changesetsCache: {[user: string]: {[project: string]: Promise<TfvcChangesetRef[]>}} = {};

const batchSize = 100;
const batchCount= 6;
async function getChangeSets(username: string, project: string, skip: number = 0): Promise<TfvcChangesetRef[]> {
    const promises: PromiseLike<TfvcChangesetRef[]>[] = [];
    for (let i = 0; i < batchCount; i++) {
        promises.push(getClient().getChangesets(project, undefined, skip + batchSize * i, batchSize, undefined, {
            author: username,
        } as TfvcChangesetSearchCriteria));
    }
    return Promise.all(promises).then(
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
        (error: TfsError): TfvcChangesetRef[] => {
            if (Number(error.status) === 404) {
                return [];
            }
        throw error;
    });
}
export class ChangsetContributionProvider implements IContributionProvider {
    public readonly name: ContributionName = "Changeset";
    public async getContributions({ identity, allProjects }: IContributionFilter): Promise<ChangesetContribution[]> {
        const username = identity.uniqueName || identity.displayName;
        const projects: string[] = allProjects ?
            (await projectsVal.getValue()).map(p => p.name)
            : [VSS.getWebContext().project.name];
        if (!(username in changesetsCache)) {
            changesetsCache[username] = {};
        }
        for (const project of projects) {
            if (!(project in changesetsCache[username])) {
                changesetsCache[username][project] = getChangeSets(username, project);
            }
        }
        const changesetsArr = await Promise.all(projects.map(async (p) =>
            changesetsCache[username][p].then(
                (changesets) => changesets.map(c => new ChangesetContribution(c, p))
            )));
        const changesets: ChangesetContribution[] = [];
        for (const arr of changesetsArr) {
            changesets.push(...arr);
        }
        return changesets;
    }
}
