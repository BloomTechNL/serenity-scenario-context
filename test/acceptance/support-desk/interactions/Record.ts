import { Interaction } from '@serenity-js/core';

import { UseScenarioContext } from '../../../../src';
import { EmailAddress } from '../domain/EmailAddress';
import { HomeAddress } from '../domain/HomeAddress';

/**
 * An actor records contact details in the scenario context, qualified by
 * the given `name`. When the underlying context is shared between several
 * actors (see `SharedDirectoryActors`), this turns it into a simple contact
 * directory the whole team can search - each actor's own details, qualified
 * by their own name.
 */
export const Record = {
    contactDetailsOf: (name: string, homeAddress: HomeAddress, emailAddress: EmailAddress) =>
        Interaction.where(`#actor records ${ name }'s contact details`, actor => {
            const ability = UseScenarioContext.as(actor);

            ability.add(homeAddress, name);
            ability.add(emailAddress, name);
        }),
};
