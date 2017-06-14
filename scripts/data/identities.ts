import { IdentityRef } from "VSS/WebApi/Contracts";
import { getClient } from "TFS/Core/RestClient";
import { WebApiTeam } from "TFS/Core/Contracts";
import { CachedValue } from "./CachedValue";
import * as Q from "q";

export interface IIdentityMap {
    [id: string]: IdentityRef;
}

function getAllIdentitiesInTeam(project: { id: string, name: string }, team: WebApiTeam): IPromise<IIdentityMap> {
    return getClient().getTeamMembers(project.id, team.id).then(members => {
        const identities: IIdentityMap = {};
        for (const member of members) {
            identities[member.id] = member;
        }
        identities[team.id] = {
            displayName: `[${project.name}]\\${team.name}`,
            id: team.id,
            isContainer: true
        } as IdentityRef;
        return identities;
    });
}

function cacheAllIdentitiesInProject(project: { id: string, name: string }): IPromise<IIdentityMap> {
    return getAllIdentitiesInProjectImpl(project, 0);
}
function getAllIdentitiesInProjectImpl(project: { id: string, name: string }, skip: number): Q.IPromise<IIdentityMap> {
    return getClient().getTeams(project.id, 100, skip).then(teams => {
        const promises = teams.map(t => getAllIdentitiesInTeam(project, t));
        if (teams.length === 100) {
            promises.push(getAllIdentitiesInProjectImpl(project, skip + 100));
        }
        return Q.all(promises).then((mapsArr) => {
            let identities: IIdentityMap = {};
            for (const map of mapsArr) {
                identities = { ...identities, ...map };
            }
            return identities;
        });
    });
}
function getAllIdentitiesInAllProjects(): IPromise<IIdentityMap> {
    return getClient().getProjects().then(projects =>
        Q.all(projects.map(p => cacheAllIdentitiesInProject(p))).then(
            (mapsArr) => {
                let identities: IIdentityMap = {};
                for (const map of mapsArr) {
                    identities = { ...identities, ...map };
                }
                return identities;
            }
        )
    );
}

const identities: CachedValue<IIdentityMap> = new CachedValue(getAllIdentitiesInAllProjects);
export enum IdentityTypes {
    Users,
    Groups,
    UsersAndGroups
}

function filterIdentities(identities: IIdentityMap, filter: (identity: IdentityRef) => boolean): IIdentityMap {
    const filtered: IIdentityMap = {};
    for (const id in identities) {
        const identity = identities[id];
        if (filter(identity)) {
            filtered[id] = identity;
        }
    }
    return filtered;
}

export function getIdentities(type: IdentityTypes = IdentityTypes.Users): Q.IPromise<IIdentityMap> {
    return identities.getValue().then(identities => {
        switch (type) {
            case IdentityTypes.UsersAndGroups:
                return identities;
            case IdentityTypes.Users:
                return filterIdentities(identities, ident => !ident.isContainer);
            case IdentityTypes.Groups:
                return filterIdentities(identities, ident => ident.isContainer);
        }
    })
}
