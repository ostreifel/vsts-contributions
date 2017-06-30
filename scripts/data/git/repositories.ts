import { CachedValue } from "../CachedValue";
import { GitRepository } from "TFS/VersionControl/Contracts";
import { getClient } from "TFS/VersionControl/GitRestClient";
import { ITag } from "OfficeFabric/components/pickers";

export const repositories = new CachedValue(() =>
  getClient().getRepositories()
);

export function searchRepositories(allProjects: boolean, filter: string): Q.IPromise<ITag[]> {
  filter = filter.toLocaleLowerCase().trim();
  const proj = VSS.getWebContext().project.id;
  return sortedRepos
    .getValue()
    .then(repositories =>
      repositories
        .filter(r => (allProjects || r.project.id === proj) && r.name.toLocaleLowerCase().lastIndexOf(filter, 0) === 0)
        .map(r => ({ key: r.id, name: r.name }))
    );
}

function getSortedRepos() {
  return repositories.getValue().then(repositories => repositories.sort((a, b) =>
    a.name.localeCompare(b.name)
  ))
}
const sortedRepos = new CachedValue(getSortedRepos);

export function getDefaultRepository(): Q.IPromise<GitRepository | undefined> {
  const projName = VSS.getWebContext().project.name;
  return sortedRepos.getValue().then(repositories => {

    if (projName === "VSOnline") {
      const [repo] = repositories.filter(r => r.name === "VSO");
      if (repo) {
        return repo;
      }
    }
    return repositories.filter(r => r.name === projName)[0] || repositories[0]
  });
}
export const defaultRepostory = new CachedValue(getDefaultRepository);
