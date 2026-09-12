import { Interaction } from '@serenity-js/core';

import { UseScenarioContext } from '../../../src/index';
import { TicketRepresentation } from '../system-under-test/index';
import { UseSupportDeskApi } from '../use-support-desk-api';

import {TicketContext} from "./ticket-context";

export const resolveTicket = (label?: string) =>
    Interaction.where(
        label ? `#actor resolves the ticket labelled ${ label }` : '#actor resolves the ticket in the spotlight',
        actor => {
            const scenarioContext = UseScenarioContext.as(actor);
            const searcher = scenarioContext.withType(TicketContext);

            const ticket = label
                ? searcher.withQualifiers(label).findOne()
                : searcher.findLastUsed();

            UseSupportDeskApi.as(actor).post<TicketRepresentation>(
                `/tickets/${ ticket.id }/resolve`, undefined, 200,
            );
        },
    );
