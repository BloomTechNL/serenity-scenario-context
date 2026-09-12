import { randomUUID } from 'node:crypto';

import { Actor, Cast } from '@serenity-js/core';

import {ScenarioContext, ScenarioContextPiece, UseScenarioContext} from '../../src/index';
import { SupportDeskApi } from './system-under-test/index';
import { TestIdentificationContext } from './test-identification-context';
import { UseSupportDeskApi } from './use-support-desk-api';

function newContext(): ScenarioContext {
    const result = new ScenarioContext();
    result.add(new ScenarioContextPiece(TestIdentificationContext.random()));
    return result;
}

export class SupportDeskCast implements Cast {
    private readonly scenarioContext = newContext();

    prepare(actor: Actor): Actor {
        return actor.whoCan(
            UseScenarioContext.using(this.scenarioContext),
            UseSupportDeskApi.using(SupportDeskApi.instance()),
        );
    }
}
