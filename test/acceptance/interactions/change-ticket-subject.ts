import { Interaction } from '@serenity-js/core';

import { UseScenarioContext } from '../../../src/index';
import { TicketRepresentation } from '../system-under-test/index';
import { UseSupportDeskApi } from '../use-support-desk-api';

import { TicketContext } from './ticket-context';

export const changeTicketSubject = (newSubject: string, label?: string) =>
    Interaction.where(
        label
            ? `#actor changes the subject of the ticket labelled ${ label } to "${ newSubject }"`
            : `#actor changes the subject of the ticket in the spotlight to "${ newSubject }"`,
        actor => {
            const qualifiers = label ? [ label ] : [];
            const piece = UseScenarioContext.as(actor).find(TicketContext, ...qualifiers);

            const ticketContext = piece.value;

            UseSupportDeskApi.as(actor).post<TicketRepresentation>(
                `/tickets/${ ticketContext.id }/subject`, { subject: newSubject }, 200,
            );

            piece.replace(ticketContext.changeSubject(newSubject));
        },
    );
