import { actorInTheSpotlight, Interaction } from '@serenity-js/core';

import { UseScenarioContext } from '../../../src/index';
import { LoginCredentialContext } from './login-credential-context';
import { SessionRepresentation } from '../system-under-test/index';
import { UseSupportDeskApi } from '../use-support-desk-api';

export const login = () =>
    Interaction.where('#actor logs in', actor => {
        const credentials = UseScenarioContext.as(actor)
            .find(LoginCredentialContext, { actor: actorInTheSpotlight().name });

        const session = UseSupportDeskApi.as(actor).post<SessionRepresentation>('/login', {
            username: credentials.username,
            password: credentials.password,
        }, 200);

        UseSupportDeskApi.as(actor).rememberSessionToken(session.token);
    });
