import { actorInTheSpotlight, Interaction } from '@serenity-js/core';

import { UseScenarioContext } from '../../../src/index';
import { LoginCredentials } from '../login-credentials';
import { SessionRepresentation } from '../system-under-test/index';
import { UseSupportDeskApi } from '../use-support-desk-api';

/**
 * Logs the actor in, using the `LoginCredentials` it recorded under its own
 * name when it registered, and remembers the session token that comes
 * back, so every request this actor makes from now on is authenticated.
 */
export const login = () =>
    Interaction.where('#actor logs in', actor => {
        const credentials = UseScenarioContext.as(actor)
            .withType(LoginCredentials)
            .withQualifiers(actorInTheSpotlight().name)
            .findOne();

        const session = UseSupportDeskApi.as(actor).post<SessionRepresentation>('/login', {
            username: credentials.username,
            password: credentials.password,
        }, 200);

        UseSupportDeskApi.as(actor).rememberSessionToken(session.token);
    });
