import { TeamProjectReference } from "TFS/Core/Contracts";
import { getClient } from "TFS/Core/RestClient";
import { CachedValue } from "./CachedValue";

export const projectsVal = new CachedValue(getProjects);
function getProjects(): PromiseLike<TeamProjectReference[]> {
    return getClient().getProjects();
}
