import { Task } from '@serenity-js/core';

import { login } from '../interactions/login';
import { register } from '../interactions/register';

export const setUpAccount = () =>
    Task.where('#actor sets up an account',
        register(),
        login(),
    );
