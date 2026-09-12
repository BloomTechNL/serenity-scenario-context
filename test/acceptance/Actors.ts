import { Actor, Cast } from '@serenity-js/core';

import { ScenarioContext, UseScenarioContext } from '../../src/index';
import { SupportDeskApi } from './system-under-test/index';
import { UseSupportDeskApi } from './UseSupportDeskApi';

/**
 * Every actor in the support desk scenario gets their own, empty
 * `ScenarioContext` to work with - just like a real support agent, they
 * don't share their notes with their colleagues. They do all work against
 * the same fake support desk system, though - just as real support agents
 * would all be calling the same backend.
 */
export class SupportDeskActors implements Cast {

    private readonly api = new SupportDeskApi();

    prepare(actor: Actor): Actor {
        return actor.whoCan(
            UseScenarioContext.using(new ScenarioContext()),
            UseSupportDeskApi.using(this.api),
        );
    }
}
