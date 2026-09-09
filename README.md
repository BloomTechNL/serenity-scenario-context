# serenity-scenario-context

A [Serenity/JS](https://serenity-js.org) ability that gives actors an advanced
form of notes: a **scenario context** of typed, qualified pieces of
information, where the most recently used piece is always "in the spotlight".

## The building blocks

- [`ScenarioContextPiece`](src/ScenarioContextPiece.ts) - pairs an arbitrary
  domain object with a set of free-form string qualifiers.
- [`ScenarioContext`](src/ScenarioContext.ts) - an ordered stack of pieces.
  It can iterate top to bottom, put a new piece on top, and move an existing
  piece back to the top.
- [`UseScenarioContext`](src/UseScenarioContext.ts) - the Serenity/JS
  `Ability`. Actors use it to `add` domain objects (qualified however you
  like) and `find` them again by type and qualifiers. Finding a piece puts it
  back on top of the context - "in the spotlight" - so that whatever you
  search for next, without being overly specific, tends to find what you were
  just working with.

## Usage

```ts
import { actorCalled, Interaction, Question } from '@serenity-js/core';
import { UseScenarioContext } from 'serenity-scenario-context';

class Ticket {
    constructor(public readonly id: string) {}
}

const RaiseATicket = (ticket: Ticket) =>
    Interaction.where(`#actor raises ticket ${ticket.id}`, actor =>
        UseScenarioContext.as(actor).add(ticket, ticket.id));

const TheTicketInTheSpotlight = () =>
    Question.about('the ticket in the spotlight', actor =>
        UseScenarioContext.as(actor).find(Ticket));

await actorCalled('Alice')
    .whoCan(UseScenarioContext.using())
    .attemptsTo(
        RaiseATicket(new Ticket('TICKET-1')),
    );
```

## Tests

- `test/unit` - unit tests for `ScenarioContext`, `ScenarioContextPiece` and
  `UseScenarioContext`, exercised in isolation from Serenity/JS actors.
- `test/acceptance/support-desk` - a runnable, end-to-end example: a fake
  "support desk" domain (`Ticket`, `Customer`) driven through real
  Serenity/JS actors, interactions and questions. Read it as a worked example
  of the ability; run it as a regression test.

```bash
npm test              # everything
npm run test:unit
npm run test:acceptance
```
