import * as Q from "q";
import {
    UserContribution,
    IUserContributions,
    IContributionProvider,
} from "./contracts";
import { CommitContributionProvider } from "./git/commits";
import { ClosePullRequestProvider, CreatePullRequestProvider } from "./git/pullrequests";
import { ChangsetContributionProvider } from "./tfvc/changsets";
import {
    CreateWorkItemContributionProvider,
    ResolveWorkItemContributionProvider,
    CloseWorkItemContributionProvider,
} from "./workitems";
import { IContributionFilter } from "../filter";
import { CachedValue } from "./CachedValue";
import { trackEvent } from "../events";

function addContributions(arr: UserContribution[], contributions: IUserContributions) {
    for (const contribution of arr) {
        const day = contribution.day.getTime();
        if (!(day in contributions)) {
            contributions[day] = [];
        }
        contributions[day].push(contribution);
    }
}
function sortContributions(contributions: IUserContributions) {
    for (const day in contributions) {
        contributions[day].sort((a, b) =>
            a.date.getTime() - b.date.getTime()
        );
    }
}

const providers: IContributionProvider[] = [
    new ClosePullRequestProvider(),
    new CreatePullRequestProvider(),
    new CommitContributionProvider(),
    new CreateWorkItemContributionProvider(),
    new ResolveWorkItemContributionProvider(),
    new CloseWorkItemContributionProvider(),
    new ChangsetContributionProvider(),
];

const contributionsCache: {[filterKey: string]: CachedValue<IUserContributions>} = {};
export function getContributions(filter: IContributionFilter): Q.IPromise<IUserContributions> {
    const filterKey = JSON.stringify({...filter, selectedDate: null});
    if (!(filterKey in contributionsCache)) {
        contributionsCache[filterKey] = new CachedValue(() =>
            Q.all(
                providers
                    .filter(p => filter.enabledProviders[p.name])
                    .map(p => p.getContributions(filter).then((r)=>r, (e) => {
                        console.log("Error ", e);
                        trackEvent("contributionError", {"message": "" + e}, undefined);
                        return [];
                    }))
            ).then((contributionsArr) => {
                const contributions: IUserContributions = {};
                for (const arr of contributionsArr) {
                    addContributions(arr, contributions);
                }
                sortContributions(contributions);
                return contributions;
            })
        );
    }
    return contributionsCache[filterKey].getValue();
}
