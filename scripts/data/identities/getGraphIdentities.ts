import { getClient } from "VSS/Graph/RestClient";
import { GraphTraversalDirection, GraphSubjectLookup, GraphSubject, PagedGraphGroups } from 'VSS/Graph/Contracts';

async function expandGroup(groupDescr: string): Promise<GraphSubject[]> {
  const users: GraphSubject[] = [];

  const seen: {[descr: string]: boolean} = {};
  const queued = [groupDescr];
  while (queued.length) {
    const next = queued.pop()!;
    if (seen[next]) {
      continue;
    }
    seen[next] = true;
    const members = await getClient().listMemberships(next, GraphTraversalDirection.Down);
    const lookup: GraphSubjectLookup = {lookupKeys: members.map(m => ({descriptor: m.memberDescriptor}))};
    const subjects = await getClient().lookupSubjects(lookup);
    for (const key in subjects) {
      const subject = subjects[key];
      if (subject.subjectKind === 'User') {
        users.push(subject);
      } else {
        queued.push(subject.descriptor);
      }
    }
  }
  return users;
}

export async function getGraphIdentities(): Promise<GraphSubject[]> {
  const projectName = VSS.getWebContext().project.name;
  const principalName = `[${projectName}]\\Project Valid Users`;
  let groupsList: PagedGraphGroups | undefined;
  do {
    const continuationToken = groupsList && groupsList.continuationToken && groupsList.continuationToken[0];
    groupsList = await getClient().listGroups(undefined, undefined, continuationToken);
    const [match] = groupsList.graphGroups.filter(g => g.principalName === principalName);
    if (match) {
      return expandGroup(match.descriptor);
    }
  } while (groupsList.continuationToken);
  return [];
}
