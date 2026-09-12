import { Answerable, Question } from '@serenity-js/core';

import { UseScenarioContext } from '../../../src/index';
import { TicketRepresentation } from '../system-under-test/index';
import { TestIdentificationContext } from '../test-identification-context';
import { UseSupportDeskApi } from '../use-support-desk-api';

/**
 * The number of tickets on record whose subject contains `subject` - a
 * case-insensitive, "contains" search, delegated straight to the fake
 * `/tickets/search` endpoint rather than filtered here, so this question
 * exercises the system under test the same way any other question in this
 * package does.
 *
 * `subject` is an `Answerable`, so it can be a plain string known up front,
 * or something resolved at run time - such as the subject of a ticket
 * raised earlier in the same scenario.
 *
 * The search is also, always, narrowed down to this scenario's own
 * `TestIdentificationContext` id - the same one `raiseTicket` folds into
 * every subject it creates - so a search for something as generic as "this"
 * or "please" can't flake by picking up a ticket some other scenario left
 * behind in the shared, singleton `SupportDeskApi`.
 */
export function numberOfTicketsFound(options: {searchTerm: Answerable<string> }) {
    return Question.about('number of tickets found', async actor => {
        const searchTerm = await actor.answer(options.searchTerm);
        const testId = UseScenarioContext.as(actor).withType(TestIdentificationContext).findOne().id;

        const query = new URLSearchParams({ subject: searchTerm, testId });

        const matches = UseSupportDeskApi.as(actor).get<TicketRepresentation[]>(`/tickets/search?${ query.toString() }`);

        return matches.length;
    });
}
