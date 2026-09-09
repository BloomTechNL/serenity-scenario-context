import { Question } from '@serenity-js/core';

import { UseScenarioContext } from '../../../../src';
import { Customer } from '../domain/Customer';
import { EmailAddress } from '../domain/EmailAddress';
import { HomeAddress } from '../domain/HomeAddress';
import { Ticket } from '../domain/Ticket';

export const TheTicketInTheSpotlight = () =>
    Question.about('the ticket in the spotlight', actor =>
        UseScenarioContext.as(actor).find(Ticket));

export const TheTicket = {
    identifiedBy: (id: string) =>
        Question.about(`ticket ${ id }`, actor =>
            UseScenarioContext.as(actor).find(Ticket, id)),

    thatIsUrgent: () =>
        Question.about('the urgent ticket', actor =>
            UseScenarioContext.as(actor).find(Ticket, 'urgent')),
};

export const TheCustomerInTheSpotlight = () =>
    Question.about('the customer in the spotlight', actor =>
        UseScenarioContext.as(actor).find(Customer));

export const TheHomeAddressOf = (name: string) =>
    Question.about(`${ name }'s home address`, actor =>
        UseScenarioContext.as(actor).find(HomeAddress, name));

export const TheEmailAddressOf = (name: string) =>
    Question.about(`${ name }'s email address`, actor =>
        UseScenarioContext.as(actor).find(EmailAddress, name));
