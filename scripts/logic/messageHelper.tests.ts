/// <reference path="../../typings/index.d.ts" />
import { expect } from 'chai';

import { MessageHelper } from "./messageHelper";

describe("Message", () => {
    it("should return all work item ids", () => {
        let messageHelper = new MessageHelper();

        expect(messageHelper.format([1, 2])).to.be.equal("Selected work item ids: 1, 2");
    });
});