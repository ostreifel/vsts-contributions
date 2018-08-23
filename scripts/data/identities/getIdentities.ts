import { WebApiTeam } from "TFS/Core/Contracts";
import { CoreHttpClient4, getClient } from "TFS/Core/RestClient";
import { IdentityRef } from "VSS/WebApi/Contracts";

import * as ExtensionCache from "./extensionCache";
import { throttlePromises } from "./throttlePromises";

interface ITeamIdentities {
    team: IdentityRef;
    members: IdentityRef[];
}
interface IProjectIdentities {
    id: string;
    name: string;
    teams: ITeamIdentities[];
}


async function hardGetAllIdentitiesInTeam(project: { id: string, name: string }, team: WebApiTeam): Promise<ITeamIdentities> {
    const teamIdentity = <IdentityRef>{ displayName: `[${project.name}]\\${team.name}`, id: team.id, isContainer: true };
    const client = getClient();

    if ("getTeamMembers" in client) {
        const members = await (client as any as CoreHttpClient4).getTeamMembers(project.id, team.id);
        const teamId: ITeamIdentities = {
            team: teamIdentity,
            members,
        };
        return teamId;

    } else {
        const members = await client.getTeamMembersWithExtendedProperties(project.id, team.id);
        const teamId: ITeamIdentities = {
            team: teamIdentity,
            members: members.map(({identity}) => identity),
        };
        return teamId;
    }
}


async function getTeamsRest(project: string, top: number, skip: number): Promise<WebApiTeam[]> {
    const client = getClient();
    const get = client.getTeams.bind(client);
    if (get.length === 3) {
        // fallback
        return get(project, top, skip);
    }
    // latest version
    return get(project, false, top, skip);
}

function hardGetAllIdentitiesInProject(project: { id: string, name: string }): IPromise<IProjectIdentities> {
    async function hardGetAllIdentitiesInProjectImpl(project: { id: string, name: string }, skip: number): Promise<IProjectIdentities> {
        const teams = await getTeamsRest(project.id, 100, skip);
        const teamPromises = throttlePromises(teams, t => hardGetAllIdentitiesInTeam(project, t), 10);
        let moreTeams: Promise<IProjectIdentities | null> = new Promise((resolve) => resolve(null));
        if (teams.length === 100) {
            moreTeams = hardGetAllIdentitiesInProjectImpl(project, skip + 100);
        }

        return Promise.all([teamPromises, moreTeams]).then(([teams, moreTeams]): IProjectIdentities => ({
            id: project.id,
            name: project.name,
            teams: [...teams, ...(moreTeams ? moreTeams.teams : [])],
        }));
    }
    return hardGetAllIdentitiesInProjectImpl(project, 0);
}

function hardGetAllIdentitiesInAllProjects(): IPromise<IProjectIdentities[]> {
    return getClient().getProjects().then(projects =>
        Promise.all(projects.map(p => hardGetAllIdentitiesInProject(p)))
    );
}

const identities: { [key: string]: Promise<IdentityRef[]> } = {};
const identitiesKey = "identities";
export function getIdentities(project?: { id: string, name: string }): Promise<IdentityRef[]> {
    const key = `${identitiesKey}-${project ? project.name : ""}-v2`;
    if (key in identities) {
        return identities[key];
    }
    async function tryGetIdentities() {
        function toIdentityArr(projects: IProjectIdentities[]): IdentityRef[] {
            const idMap: { [id: string]: IdentityRef } = {};
            for (const { teams } of projects) {
                for (const {team, members} of teams) {
                    idMap[team.id] = team;
                    for(const member of members) {
                        idMap[member.id] = member;
                    }
                }
            }
            return Object.keys(idMap).map(id => idMap[id]);
        }
        async function hardGet(): Promise<ExtensionCache.IHardGetValue<IProjectIdentities[]>> {
            const expiration = new Date();
            expiration.setMinutes(expiration.getMinutes() + 2);
            if (project) {
                return hardGetAllIdentitiesInProject(project).then((project) => ({
                    value: [project],
                    expiration,
                }));
            } else {
                return hardGetAllIdentitiesInAllProjects().then((projects) => ({
                    value: projects,
                    expiration,
                }));
            }
        }
        // return ExtensionCache.get<IProjectIdentities[]>(key, hardGet).then(toIdentityArr);
        return hardGet().then(({value}) => toIdentityArr(value));
    }
    if (!(key in identities)) {
        identities[key] = tryGetIdentities();
    }
    return identities[key];
}
