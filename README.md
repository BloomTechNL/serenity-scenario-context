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
  `Ability`. Actors use it to `add` domain objects, qualified however you
  like, and `withType(Type)` to start searching for them again.
- [`ScenarioContextSearcher`](src/ScenarioContextSearcher.ts) - returned by
  `withType`. Narrow it down with `withQualifiers(...)`, then resolve it
  with one of:
  - `findOne()` - insists that exactly one piece matches, and throws
    otherwise (including when more than one does - it doesn't guess);
  - `findLastUsed()` - when several pieces might match, returns whichever
    one was put on top of the context most recently, no questions asked.

  Either way, the piece that's found is put back on top of the context -
  "in the spotlight" - so that whatever you search for next, without being
  overly specific, tends to find what you were just working with.

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
        UseScenarioContext.as(actor).withType(Ticket).findLastUsed());

const TheTicketIdentifiedBy = (id: string) =>
    Question.about(`ticket ${id}`, actor =>
        UseScenarioContext.as(actor).withType(Ticket).withQualifiers(id).findOne());

await actorCalled('Alice')
    .whoCan(UseScenarioContext.using())
    .attemptsTo(
        RaiseATicket(new Ticket('TICKET-1')),
    );
```

## Tests

- `test/unit` - unit tests for `ScenarioContext`, `ScenarioContextPiece`,
  `ScenarioContextSearcher` and `UseScenarioContext`, exercised in isolation
  from Serenity/JS actors.
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
  automatically. Every test therefore uses its own actor name, never reused
  elsewhere in the file, so each actor is always freshly prepared rather
  than resurrected with whatever ability (and however-populated a
  `ScenarioContext`) an earlier test left them with. This matters more than
  it otherwise would because `findOne()` fails outright on any unexpected
  leftover match, rather than silently picking one. See the comment above
  `describe('A support agent using the scenario context', ...)` for the full
  explanation.

```bash
npm test              # everything
npm run test:unit
npm run test:acceptance
```
