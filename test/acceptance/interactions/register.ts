import { actorInTheSpotlight, Interaction } from '@serenity-js/core';

import { UseScenarioContext } from '../../../src/index';
import { LoginCredentials } from '../login-credentials';
import { AccountRepresentation } from '../system-under-test/index';
import { UseSupportDeskApi } from '../use-support-desk-api';

export const register = () =>
    Interaction.where('#actor registers an account', actor => {
        const credentials = LoginCredentials.random();

        UseSupportDeskApi.as(actor).post<AccountRepresentation>('/register', {
            username: credentials.username,
            password: credentials.password,
        });

        UseScenarioContext.as(actor).add(credentials, actorInTheSpotlight().name);
    });
