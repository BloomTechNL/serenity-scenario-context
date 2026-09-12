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
  "support desk" domain driven through a real Serenity/JS actor. Read it as
  a worked example of the ability; run it as a regression test. Currently
  two small scenarios - an agent raises a couple of tickets and resolves
  one by label, either the one in the spotlight or the earlier one, leaving
  the other untouched either way - kept deliberately small; more can be
  added the same way.

  `raiseTicket` and `resolveTicket` - the "interactions" - are real
  Serenity/JS `Interaction`s, built with `Interaction.where(...)` and
  performed via `attemptsTo`; `ticket` - the "question" - is a real
  `Question`, built with `Question.about(...)`, same as anywhere else in
  Serenity/JS. None of them take the actor as an argument: like any
  `Interaction` or `Question`, they're handed the actor performing or
  asking them - by `attemptsTo`/`Ensure.that` - only once they're actually
  run, not by the spec that builds them. None of them reach into a
  fake domain's objects directly - they talk to
  [`system-under-test`](test/acceptance/system-under-test), a small fake backend exposed
  over an HTTP-like `HttpApi`, via the `UseSupportDeskApi` ability, then
  remember what it told them in the actor's `ScenarioContext`. This keeps
  "the test" - exercising `UseScenarioContext` - clearly apart from "the
  (fake) system it's driving", the way a real end-to-end test would be
  structured. `Ticket` - the domain type - lives next to `raiseTicket`, the
  interaction that first puts a piece of that type on the scenario context,
  rather than in a shared "domain" module - and it's never imported by
  `SupportDesk.test.ts`. The spec only deals in plain data: the details
  `raiseTicket` needs (just a `label`, here - every field of `TicketDetails`
  is optional, and whatever's missing is generated, randomised or defaulted,
  so a spec only has to spell out what actually matters to it), and
  `Ensure`/`property`/`equals` expectations checked against what `ticket`
  returns - here, only its `status`, since this scenario doesn't care what a
  ticket's `subject` or `priority` are, only that resolving one changes its
  status without touching the other one's. A piece of context is an
  implementation detail of the interaction/question functions that put it on
  and read it off the `ScenarioContext` - not something a spec constructs or
  imports itself.

  Ticket ids are generated by [`system-under-test`](test/acceptance/system-under-test)
  itself (as UUIDs), not supplied by the caller - the same way a real
  backend would hand out its own opaque ids. `raiseTicket` instead takes a
  `label`: a human-readable name this scenario gives the ticket, used to
  qualify it in the `ScenarioContext` (see `ScenarioContextPiece` above).
  `resolveTicket` and `ticket` both accept that same `label` (optionally -
  omit it and either acts on whichever ticket is currently "in the
  spotlight" instead). `ticket` recalls the actor's own notes to translate
  the `label` into the real id, then asks the system for that ticket's
  canonical state - the way a real client would keep its own mapping from a
  friendly name to whatever id a backend actually uses - and hands back
  just its `subject`, `priority` and `status`, leaving the id out of it
  entirely, since a spec has no way to predict it and no reason to care
  what it is.

  Note: this project uses plain Jest, which - unlike Serenity/JS's official
  Mocha, Jasmine and Cucumber adapters - doesn't reset actors between tests
  automatically, and Serenity/JS only ever prepares an actor - i.e. grants
  them the abilities a `Cast` describes - the first time their name is used;
  calling `engage(...)` again in a `beforeEach` doesn't re-prepare an actor
  that already exists, so it wouldn't reset anything for a test reusing an
  actor's name. Both tests here call `actorCalled('Chidi')`, so instead of
  `engage`, `beforeEach` calls `SupportDeskActors#prepare` directly on that
  actor: `Actor#whoCan` replaces an existing ability of a given type rather
  than stacking it, so handing Chidi a *new* `SupportDeskActors` grants a
  fresh `ScenarioContext` and a fresh fake system before every test, however
  many times Chidi's been on stage before. This matters more than it
  otherwise would because `findOne()` fails outright on any unexpected
  leftover match, rather than silently picking one. See the comment above
  `beforeEach` in `SupportDesk.test.ts` for the full explanation.

```bash
npm test              # everything
npm run test:unit
npm run test:acceptance
```
