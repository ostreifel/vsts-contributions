import {
    IContributionProvider,
    ContributionName,
    UserContribution,
    CreateWorkItemContribution,
    ResolveWorkItemContribution,
    CloseWorkItemContribution,
} from "./contracts";
import * as Q from "q";
import { WorkItem, WorkItemQueryResult } from "TFS/WorkItemTracking/Contracts";
import { getClient } from "TFS/WorkItemTracking/RestClient";
import { yearStart } from "./dates";
import { CachedValue } from "./CachedValue";
import { IContributionFilter } from "../filter"
import { format } from "VSS/Utils/Date";

const baseQuery = `SELECT
        [System.Id],
        [System.WorkItemType],
        [System.Title]
FROM workitems
WHERE
        #userfield = '#user'
        and #datefield >= '#date'
`;
const filterProjectClause = ' and [System.TeamProject] = @project';

function getStateQuery(fieldPrefix: string, username: string, allProjects: boolean): string {
    // This should really use query parameters but theres no such thing for wiql
    return baseQuery
        .replace("#userfield", `${fieldPrefix}By`)
        .replace("#datefield", `${fieldPrefix}Date`)
        .replace("#user", username)
        .replace("#date", format(yearStart, "yyyy-MM-dd"))
        .concat(allProjects ? "" : filterProjectClause);
}

const wiCache: { [id: number]: CachedValue<WorkItem> } = {};
function getWorkItems(ids: number[]): Q.IPromise<WorkItem[]> {
    let coldIds = ids.filter(id => !(id in wiCache));
    while(coldIds.length > 0) {
        const idBatch = coldIds.slice(0, 200);
        coldIds = coldIds.slice(200);
        const wisPromise = getClient().getWorkItems(idBatch).then(wis => {
            const wiMap: {[id: number]: WorkItem} = {};
            for (const wi of wis) {
                wiMap[wi.id] = wi;
            }
            return wiMap;
        });
        for (const id of idBatch) {
            wiCache[id] = new CachedValue(() => wisPromise.then(map => map[id]));
        }
    }
    return Q.all(ids.map(id => wiCache[id].getValue()));
}


const queryResults: { [query: string]: CachedValue<WorkItemQueryResult> } = {};
function getQueryResults(query: string): Q.IPromise<WorkItemQueryResult> {
    if (!(query in queryResults)) {
        const project = VSS.getWebContext().project.id;
        queryResults[query] = new CachedValue(() => getClient().queryByWiql({ query }, project))
    }
    return queryResults[query].getValue();
}

function getWorkItemsForQuery(query: string): Q.IPromise<WorkItem[]> {
    return getQueryResults(query).then(queryResult =>
        getWorkItems(queryResult.workItems.map(wi => wi.id)));
}

export class CreateWorkItemContributionProvider implements IContributionProvider {
    public readonly name: ContributionName = "CreateWorkItem";
    public getContributions(filter: IContributionFilter): Q.IPromise<UserContribution[]> {
        const username = filter.identity.uniqueName || filter.identity.displayName;
        const query = getStateQuery("System.Created", username, filter.allProjects);
        return getWorkItemsForQuery(query).then(wis =>
            wis.map(wi => new CreateWorkItemContribution(wi))
        );
    }
}

export class ResolveWorkItemContributionProvider implements IContributionProvider {
    public readonly name: ContributionName = "ResolveWorkItem";
    public getContributions(filter: IContributionFilter): Q.IPromise<UserContribution[]> {
        const username = filter.identity.uniqueName || filter.identity.displayName;
        const query = getStateQuery("Microsoft.VSTS.Common.Resolved", username, filter.allProjects);
        return getWorkItemsForQuery(query).then(wis =>
            wis.map(wi => new ResolveWorkItemContribution(wi))
        );
    }
}

export class CloseWorkItemContributionProvider implements IContributionProvider {
    public readonly name: ContributionName = "CloseWorkItem";
    public getContributions(filter: IContributionFilter): Q.IPromise<UserContribution[]> {
        const username = filter.identity.uniqueName || filter.identity.displayName;
        const query = getStateQuery("Microsoft.VSTS.Common.Closed", username, filter.allProjects);
        return getWorkItemsForQuery(query).then(wis =>
            wis.map(wi => new CloseWorkItemContribution(wi))
        );
    }
}
