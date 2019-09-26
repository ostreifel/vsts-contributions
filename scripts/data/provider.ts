import { trackEvent } from "../events";
import { IContributionFilter, IIndividualContributionFilter } from "../filter";
import { IContributionProvider, IUserContributions, UserContribution } from "./contracts";
import { CommitContributionProvider } from "./git/commits";
import { ClosePullRequestProvider, CreatePullRequestProvider, ReviewPullRequestProvider } from "./git/pullrequests";
import { ChangsetContributionProvider } from "./tfvc/changsets";
import {
    CloseWorkItemContributionProvider,
    CreateWorkItemContributionProvider,
    ResolveWorkItemContributionProvider,
} from "./workitems";

function addContributions(arr: UserContribution[], contributions: IUserContributions) {
    for (const contribution of arr) {
        const day = contribution.day.getTime();
        if (!(day in contributions.data)) {
            contributions.data[day] = [];
        }
        contributions.data[day].push(contribution);
    }
}
function sortContributions(contributions: IUserContributions) {
    for (const day in contributions.data) {
        contributions.data[day].sort((a, b) =>
            a.date.getTime() - b.date.getTime()
        );
    }
}

const providers: IContributionProvider[] = [
    new ClosePullRequestProvider(),
    new CreatePullRequestProvider(),
    new ReviewPullRequestProvider(),
    new CommitContributionProvider(),
    new CreateWorkItemContributionProvider(),
    new ResolveWorkItemContributionProvider(),
    new CloseWorkItemContributionProvider(),
    new ChangsetContributionProvider(),
];

let contributionCounter = 0;
async function hardGetContributions(filter: IIndividualContributionFilter) {
    const contributionsArr = await Promise.all(
        providers
            .filter(p => filter.enabledProviders[p.name])
            .map(p => p.getContributions(filter).then((r) => r, (e) => {
                console.log("Error ", e);
                trackEvent("contributionError", { "message": "" + e }, undefined);
                return [];
            }))
    );
    const contributions: IUserContributions = {
        user: filter.identity,
        key: contributionCounter++,
        data: {},
    };
    for (const arr of contributionsArr) {
        addContributions(arr, contributions);
    }
    sortContributions(contributions);
    return contributions;
}

const contributionsCache: { [filterKey: string]: Promise<IUserContributions> } = {};
export function getContributions(filter: IContributionFilter): Promise<IUserContributions[]> {
    return Promise.all(filter.identities.map((identity) => {
        const individualFilter: IIndividualContributionFilter = {
            identity,
            allProjects: filter.allProjects,
            enabledProviders: filter.enabledProviders,
            repositories: filter.repositories,
        };
        const filterKey = JSON.stringify(individualFilter);
        if (!(filterKey in contributionsCache)) {
            contributionsCache[filterKey] = hardGetContributions(individualFilter);
        }
        return contributionsCache[filterKey];
    }));
}
