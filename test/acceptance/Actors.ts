import { Actor, Cast } from '@serenity-js/core';

import { ScenarioContext, UseScenarioContext } from '../../src/index';
import { SupportDeskApi } from './system-under-test/index';
import { UseSupportDeskApi } from './UseSupportDeskApi';

export class SupportDeskCast implements Cast {

    private readonly api = new SupportDeskApi();

    prepare(actor: Actor): Actor {
        return actor.whoCan(
            UseScenarioContext.using(new ScenarioContext()),
            UseSupportDeskApi.using(this.api),
        );
    }
}
