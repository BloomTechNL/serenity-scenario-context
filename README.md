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
  "support desk" domain (`Ticket`, `Customer`, `HomeAddress`, `EmailAddress`)
  driven through real Serenity/JS actors, interactions and questions. Read it
  as a worked example of the ability; run it as a regression test. It covers
  two flavours of the ability:
  - each actor with their own, isolated `ScenarioContext` (`SupportDeskActors`);
  - several actors sharing one `ScenarioContext` as a small contact
    directory, qualifying each piece by the actor's name it belongs to
    (`SharedDirectoryActors`).

  Note: this project uses plain Jest, which - unlike Serenity/JS's official
  Mocha, Jasmine and Cucumber adapters - doesn't reset actors between tests
  automatically. The suites therefore avoid reusing an actor's name across
  `describe` blocks that `engage` a different `Cast`, so that each actor is
  always freshly prepared with the ability the current test expects. See the
  comment above `describe('Several actors sharing a scenario context...`
  for the full explanation.

```bash
npm test              # everything
npm run test:unit
npm run test:acceptance
```
