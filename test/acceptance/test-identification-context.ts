import {randomUUID} from "node:crypto";


export class TestIdentificationContext {
    constructor(
        public readonly id: string,
    ) {
    }

    public static random(): TestIdentificationContext {
        return new TestIdentificationContext(randomUUID());
    }
}
