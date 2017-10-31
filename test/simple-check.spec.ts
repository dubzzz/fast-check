import { expect } from 'chai';
import greeter from '../src/simple-check';

describe("simple-check", () => {
    it("Should return hello message", () => {
        expect(greeter("John")).to.equal("Hello, John");
    });
});
