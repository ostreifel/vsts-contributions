import {
    IContributionProvider,
    ContributionName,
    IContributionFilter,
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

const baseQuery = `SELECT
        [System.Id],
        [System.WorkItemType],
        [System.Title]
FROM workitems
WHERE
        #userfield = '#user'
        and #datefield >= "#date"
`;
const filterProjectClause = ' and [System.TeamProject] = @project';

function getStateQuery(fieldPrefix: string, username: string, allProjects: boolean): string {
    // This should really use query parameters but theres no such thing for wiql
    return baseQuery
        .replace("#userfield", `${fieldPrefix}By`)
        .replace("#datefield", `${fieldPrefix}Date`)
        .replace("#user", username)
        .replace("#date", yearStart.toLocaleDateString())
        .concat(allProjects ? "" : filterProjectClause);
}

const wiCache: { [id: number]: WorkItem } = {};
function getWorkItemsImpl(ids: number[]): Q.IPromise<WorkItem[]> {
    if (ids.length === 0) {
        return Q([]);
    }
    const first200 = ids.slice(0, 200);
    const otherIds = ids.slice(200);
    // Do all 200 batches at the same time since the number of ids is already known
    // no need to check the current page is full before going to the next one
    return Q.all([getClient().getWorkItems(first200), getWorkItemsImpl(otherIds)]).then(([wis, moreWis]) =>
        [...wis, ...moreWis]
    );
}
function getWorkItems(ids: number[]): Q.IPromise<WorkItem[]> {
    const cachedIds = ids.filter(id => id in wiCache);
    const coldIds = ids.filter(id => !(id in wiCache));
    const cachedWis = cachedIds.map(id => wiCache[id]);
    return getWorkItemsImpl(coldIds).then(moreWis => {
        for (const wi of moreWis) {
            wiCache[wi.id] = wi;
        }
        return [...moreWis, ...cachedWis];
    });
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
        const query = getStateQuery("System.Created", filter.username, filter.allProjects);
        return getWorkItemsForQuery(query).then(wis =>
            wis.map(wi => new CreateWorkItemContribution(wi))
        );
    }
}

export class ResolveWorkItemContributionProvider implements IContributionProvider {
    public readonly name: ContributionName = "ResolveWorkItem";
    public getContributions(filter: IContributionFilter): Q.IPromise<UserContribution[]> {
        const query = getStateQuery("Microsoft.VSTS.Common.Resolved", filter.username, filter.allProjects);
        return getWorkItemsForQuery(query).then(wis =>
            wis.map(wi => new ResolveWorkItemContribution(wi))
        );
    }
}

export class CloseWorkItemContributionProvider implements IContributionProvider {
    public readonly name: ContributionName = "CloseWorkItem";
    public getContributions(filter: IContributionFilter): Q.IPromise<UserContribution[]> {
        const query = getStateQuery("Microsoft.VSTS.Common.Closed", filter.username, filter.allProjects);
        return getWorkItemsForQuery(query).then(wis =>
            wis.map(wi => new CloseWorkItemContribution(wi))
        );
    }
}
