import { Answerable, Question } from '@serenity-js/core';

import { UseScenarioContext } from '../../../src/index';
import { TicketRepresentation } from '../system-under-test/index';
import { TestIdentificationContext } from '../test-identification-context';
import { UseSupportDeskApi } from '../use-support-desk-api';

export function numberOfTicketsFound(options: { searchTerm: Answerable<string> }) {
    return Question.about('number of tickets found', async actor => {
        const searchTerm = await actor.answer(options.searchTerm);
        const testId = UseScenarioContext.as(actor).withType(TestIdentificationContext).findOne().getValue().id;

        const query = new URLSearchParams({ subject: searchTerm, testId });

        const matches = UseSupportDeskApi.as(actor).get<TicketRepresentation[]>(`/tickets/search?${ query.toString() }`);

        return matches.length;
    });
}
