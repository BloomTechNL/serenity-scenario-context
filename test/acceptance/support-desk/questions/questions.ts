import { Question } from '@serenity-js/core';

import { UseScenarioContext } from '../../../../src';
import { Customer } from '../domain/Customer';
import { EmailAddress } from '../domain/EmailAddress';
import { HomeAddress } from '../domain/HomeAddress';
import { Ticket } from '../domain/Ticket';

// "In the spotlight" means "whichever one was used most recently" - by
// definition there could be several tickets in the context, so this uses
// findLastUsed() rather than insisting on a single match.
export const TheTicketInTheSpotlight = () =>
    Question.about('the ticket in the spotlight', actor =>
        UseScenarioContext.as(actor).withType(Ticket).findLastUsed());

export const TheTicket = {
    // A ticket id may end up qualifying more than one piece over the course
    // of a scenario (see Resolve, which re-tags a ticket rather than
    // replacing it), so this asks for whichever was used most recently.
    identifiedBy: (id: string) =>
        Question.about(`ticket ${ id }`, actor =>
            UseScenarioContext.as(actor).withType(Ticket).withQualifiers(id).findLastUsed()),

    // Only one ticket is expected to be qualified 'urgent' at a time, so
    // findOne() is used to make that assumption explicit - and to fail
    // loudly if it's ever violated.
    thatIsUrgent: () =>
        Question.about('the urgent ticket', actor =>
            UseScenarioContext.as(actor).withType(Ticket).withQualifiers('urgent').findOne()),
};

export const TheCustomerInTheSpotlight = () =>
    Question.about('the customer in the spotlight', actor =>
        UseScenarioContext.as(actor).withType(Customer).findLastUsed());

// A given name is expected to identify exactly one home/email address in
// the directory, so findOne() is the right choice here.
export const TheHomeAddressOf = (name: string) =>
    Question.about(`${ name }'s home address`, actor =>
        UseScenarioContext.as(actor).withType(HomeAddress).withQualifiers(name).findOne());

export const TheEmailAddressOf = (name: string) =>
    Question.about(`${ name }'s email address`, actor =>
        UseScenarioContext.as(actor).withType(EmailAddress).withQualifiers(name).findOne());
