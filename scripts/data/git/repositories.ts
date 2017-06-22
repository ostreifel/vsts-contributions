import { CachedValue } from "../CachedValue";
import { getClient } from "TFS/VersionControl/GitRestClient";
import { ITag } from "OfficeFabric/components/pickers";

export const repositories = new CachedValue(() =>
  getClient().getRepositories()
);

export function searchRepositories(filter: string): Q.IPromise<ITag[]> {
  filter = filter.toLocaleLowerCase();
  return repositories
    .getValue()
    .then(repositories =>
      repositories
        .filter(r => r.name.toLocaleLowerCase().lastIndexOf(filter, 0) === 0)
        .map(r => ({ key: r.id, name: r.name }))
    );
}
