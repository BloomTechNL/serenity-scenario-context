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

/**
 * Unlike `SupportDeskActors`, every actor prepared by this cast is given the
 * *same* `ScenarioContext` instance - turning it into a shared contact
 * directory the whole team can read from and write to, the same way several
 * actors might share a `Notepad` in "vanilla" Serenity/JS.
 */
export class SharedDirectoryActors implements Cast {

    private readonly sharedContext = new ScenarioContext();

    prepare(actor: Actor): Actor {
        return actor.whoCan(
            UseScenarioContext.using(this.sharedContext),
        );
    }
}
