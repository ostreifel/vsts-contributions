import {
    IContributionProvider,
    ContributionName,
    UserContribution,
    CreateWorkItemContribution,
    ResolveWorkItemContribution,
    CloseWorkItemContribution,
} from "./contracts";
import { WorkItem } from "TFS/WorkItemTracking/Contracts";
import { getClient } from "TFS/WorkItemTracking/RestClient";
import { yearStart } from "./dates";
import { CachedValue } from "./CachedValue";
import { IContributionFilter } from "../filter";
import { format } from "VSS/Utils/Date";

const baseQuery = `SELECT
        [System.Id],
        [System.WorkItemType],
        [System.Title]
FROM workitems
WHERE
        #userfield = '#user'
        and #datefield >= '#date'
        and [System.ChangedDate] < '#earlierThanDate'
`;
const filterProjectClause = ' and [System.TeamProject] = @project';
const orderClause = ' ORDER BY [System.ChangedDate] desc';

function getStateQuery(fieldPrefix: string, username: string, allProjects: boolean): string {
    // This should really use query parameters but theres no such thing for wiql
    return baseQuery
        .replace("#userfield", `${fieldPrefix}By`)
        .replace("#datefield", `${fieldPrefix}Date`)
        .replace("#user", username)
        .replace("#date", format(yearStart, "yyyy-MM-dd"))
        .concat(allProjects ? "" : filterProjectClause)
        .concat(orderClause);
}

const wiCache: { [id: number]: CachedValue<WorkItem> } = {};
const batchSize = 200;
function getWorkItems(ids: number[]): Promise<WorkItem[]> {
    let coldIds = ids.filter(id => !(id in wiCache));
    while(coldIds.length > 0) {
        const idBatch = coldIds.slice(0, batchSize);
        coldIds = coldIds.slice(batchSize);
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
    return Promise.all(ids.map(id => wiCache[id].getValue()));
}

const queryResults: { [query: string]: CachedValue<WorkItem[]> } = {};
function getWorkItemsForQuery(query: string): Promise<WorkItem[]> {
    const BATCH_SIZE = 20000 - 1;
    async function getResults(earlierThanDate: string = new Date().toJSON()): Promise<WorkItem[]> {
        const project = VSS.getWebContext().project.id;
        const fullQuery = query
            .replace("#earlierThanDate", earlierThanDate);
        const results = await getClient().queryByWiql({ query: fullQuery }, project, undefined, true, BATCH_SIZE);
        const workitems = await getWorkItems(results.workItems.map((wi) => wi.id));
        if (workitems.length !== BATCH_SIZE) {
            return workitems;
        }
        const newDate = workitems[workitems.length - 1].fields["System.ChangedDate"];
        return getResults(newDate).then((moreWorkItems) =>
            [...workitems, ...moreWorkItems]
        );
    }
    if (!(query in queryResults)) {
        queryResults[query] = new CachedValue(() => getResults());
    }
    return queryResults[query].getValue();
}

export class CreateWorkItemContributionProvider implements IContributionProvider {
    public readonly name: ContributionName = "CreateWorkItem";
    private readonly queryResults: {[query: string]: CachedValue<CreateWorkItemContribution[]>} = {};
    public getContributions(filter: IContributionFilter): Promise<UserContribution[]> {
        const username = filter.identity.uniqueName || filter.identity.displayName;
        const query = getStateQuery("System.Created", username, filter.allProjects);
        if (!(query in this.queryResults)) {
            this.queryResults[query]  = new CachedValue(() => getWorkItemsForQuery(query).then(wis =>
                wis.map(wi => new CreateWorkItemContribution(wi))
            ));
        }
        return this.queryResults[query].getValue();
    }
}

export class ResolveWorkItemContributionProvider implements IContributionProvider {
    public readonly name: ContributionName = "ResolveWorkItem";
    private readonly queryResults: {[query: string]: CachedValue<ResolveWorkItemContribution[]>} = {};
    public getContributions(filter: IContributionFilter): Promise<UserContribution[]> {
        const username = filter.identity.uniqueName || filter.identity.displayName;
        const query = getStateQuery("Microsoft.VSTS.Common.Resolved", username, filter.allProjects);
        if (!(query in this.queryResults)) {
            this.queryResults[query]  = new CachedValue(() => getWorkItemsForQuery(query).then(wis =>
                wis.map(wi => new ResolveWorkItemContribution(wi))
            ));
        }
        return this.queryResults[query].getValue();
    }
}

export class CloseWorkItemContributionProvider implements IContributionProvider {
    public readonly name: ContributionName = "CloseWorkItem";
    private readonly queryResults: {[query: string]: CachedValue<ResolveWorkItemContribution[]>} = {};
    public getContributions(filter: IContributionFilter): Promise<UserContribution[]> {
        const username = filter.identity.uniqueName || filter.identity.displayName;
        const query = getStateQuery("Microsoft.VSTS.Common.Closed", username, filter.allProjects);
        if (!(query in this.queryResults)) {
            this.queryResults[query]  = new CachedValue(() => getWorkItemsForQuery(query).then(wis =>
                wis.map(wi => new CloseWorkItemContribution(wi))
            ));
        }
        return this.queryResults[query].getValue();
    }
}
