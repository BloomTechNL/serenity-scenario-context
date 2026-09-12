import { Actor, Cast } from '@serenity-js/core';

import { ScenarioContext, ScenarioContextPiece, UseScenarioContext } from '../../src/index';
import { SupportDeskApi } from './system-under-test/index';
import { TestIdentificationContext } from './test-identification-context';
import { UseSupportDeskApi } from './use-support-desk-api';

export class SupportDeskCast implements Cast {
    private readonly scenarioContext = new ScenarioContext();

    public constructor() {
        this.scenarioContext.add(new ScenarioContextPiece(TestIdentificationContext.random()));
    }

    prepare(actor: Actor): Actor {
        return actor.whoCan(
            UseScenarioContext.using(this.scenarioContext),
            UseSupportDeskApi.using(SupportDeskApi.instance()),
        );
    }
}
