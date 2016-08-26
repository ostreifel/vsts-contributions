var actionProvider =  {
    getMenuItems: (context) => {
        return [<IContributedMenuItem>{
            title: "Work Item Menu Action",
            action: (actionContext) => {
                let workItemId = actionContext.id
                    || (actionContext.ids && actionContext.ids.length > 0 && actionContext.ids[0])
                    || (actionContext.workItemIds && actionContext.workItemIds.length > 0 && actionContext.workItemIds[0]);
                    
                if (workItemId) {
                    alert(`Selected work item ${workItemId}`);
                }
            }
        }];
    }
};

// Register context menu action provider
const publisherId = VSS.getExtensionContext().publisherId;
VSS.register(`${ publisherId }.vsts-extension-ts-seed-simple.vsts-extension-ts-seed-simple-action`, actionProvider);