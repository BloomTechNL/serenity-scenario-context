import { Actor, Cast } from '@serenity-js/core';

import { ScenarioContext, UseScenarioContext } from '../../../src';

/**
 * Every actor in the support desk scenario gets their own, empty
 * `ScenarioContext` to work with - just like a real support agent, they
 * don't share their notes with their colleagues.
 */
export class SupportDeskActors implements Cast {
    prepare(actor: Actor): Actor {
        return actor.whoCan(
            UseScenarioContext.using(new ScenarioContext()),
        );
    }
}
