import { Actor, Cast } from '@serenity-js/core';

import { ScenarioContext, UseScenarioContext } from '../../src/index';
import { SupportDeskApi } from './system-under-test/index';
import { UseSupportDeskApi } from './use-support-desk-api';

export class SupportDeskCast implements Cast {
    private readonly scenarioContext = new ScenarioContext();

    prepare(actor: Actor): Actor {
        return actor.whoCan(
            UseScenarioContext.using(this.scenarioContext),
            UseSupportDeskApi.using(SupportDeskApi.instance()),
        );
    }
}
