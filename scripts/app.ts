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
VSS.register("<your-publisher>.vsts-extension-ts-seed-simple.vsts-extension-ts-seed-simple-action", actionProvider);
VSS.register("vsts-extension-ts-seed-simple-action", actionProvider);