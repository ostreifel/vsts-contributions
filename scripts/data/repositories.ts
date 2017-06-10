import { CachedValue } from "./CachedValue";
import { getClient } from "TFS/VersionControl/GitRestClient";

export const repositories = new CachedValue(() => getClient().getRepositories());
