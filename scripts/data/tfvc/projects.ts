import { TeamProjectReference } from "TFS/Core/Contracts";
import { getClient } from "TFS/Core/RestClient";
import { CachedValue } from "../CachedValue";

export const projects = new CachedValue(getProjects);
function getProjects(): Q.IPromise<TeamProjectReference[]> {
    return getClient().getProjects();
}
