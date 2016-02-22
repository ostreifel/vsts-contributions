/// <reference path='../typings/tsd.d.ts' />

import Q = require("q");

// Register context menu action
VSS.register("vsts-extension-ts-seed-simple-action", {
    getMenuItems: (context) => {
        return [<IContributedMenuItem>{
            title: "Work Item Menu Action"
        }];
    }
});