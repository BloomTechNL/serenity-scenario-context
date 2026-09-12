# serenity-scenario-context

A [Serenity/JS](https://serenity-js.org) `Ability` that gives actors an
advanced form of notes: a **scenario context** of typed, qualified pieces of
information, where the piece most recently added or looked up is always
"in the spotlight".

## How is this different from Serenity/JS's `Notes`?

Serenity/JS already ships an `Ability` for remembering things: `TakeNotes`,
backed by a `Notepad`. It's a flat key/value store - `notes().set('key',
value)`, `notes().get('key')` - and it's a great fit when there's one value
per name and you know that name upfront.

`ScenarioContext` is for a different shape of problem: when an actor may be
holding onto **several objects of the same type at once**, and what you want
back isn't "whatever is stored under this exact key" but "the `Ticket` I
just raised", or "the `Ticket` labelled `billing`", without having invented
and threaded a unique string key through the whole scenario for every one of
them.

Concretely:

|                                   | `Notes`                                   | `ScenarioContext`                                             |
|-----------------------------------|--------------------------------------------|----------------------------------------------------------------|
| Organised by                      | a key you choose                           | the value's own type, an ordered stack                          |
| Telling two values apart          | give them different keys                   | free-form `qualifiers`, any number of them, in any combination  |
| "The one I was just using"        | not tracked - you'd track it yourself       | built in: adding or finding a piece puts it "in the spotlight"  |
| Retrieving without an exact key   | not possible                                | `withType(Type).findLastUsed()`                                 |
| Retrieving something specific     | `notes().get('the-exact-key')`             | `withType(Type).withQualifiers(...).findOne()`                   |
| Ambiguity (two things could match)| whichever one you happen to `get`           | `findOne()` throws - it never silently guesses                  |

For example, an actor that raises a `billing` ticket and then a `login`
ticket, and later wants to resolve "the ticket labelled `billing`", or
"whichever ticket I was just looking at" - with `Notes` you'd need to invent
and remember distinct keys (`'ticket-billing'`, `'ticket-login'`) and there's
no way to ask for "the most recent one" without also tracking that
separately. With `ScenarioContext`:

```ts
UseScenarioContext.as(actor).add(billingTicket, 'billing');
UseScenarioContext.as(actor).add(loginTicket, 'login');

// whichever Ticket was added or found most recently - the login ticket,
// since it was the last one added and nothing has searched yet:
UseScenarioContext.as(actor).withType(Ticket).findLastUsed();

// the one labelled 'billing', found unambiguously by type + qualifier -
// note that finding it also puts it back in the spotlight:
UseScenarioContext.as(actor).withType(Ticket).withQualifiers('billing').findOne();
```

If your scenario only ever needs one value per name, reach for `Notes` -
it's simpler. Reach for `ScenarioContext` once you have several instances of
the same domain type in play and want to recall them the way you'd talk
about them - by type, and by how you'd describe or most recently used one -
rather than by a key invented purely for storage.

## The building blocks

- [`ScenarioContextPiece`](src/scenario-context-piece.ts) - pairs an
  arbitrary domain object with a set of free-form string qualifiers.
- [`ScenarioContext`](src/scenario-context.ts) - an ordered stack of pieces.
  It can iterate top to bottom, put a new piece on top (either an
  already-built `ScenarioContextPiece`, or a plain value plus its
  qualifiers), and move an existing piece back to the top.
- [`UseScenarioContext`](src/use-scenario-context.ts) - the Serenity/JS
  `Ability`. Actors use it to `add` domain objects, qualified however you
  like, and `withType(Type)` to start searching for them again.
- [`ScenarioContextSearcher`](src/scenario-context-searcher.ts) - returned by
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
import { Ensure, equals } from '@serenity-js/assertions';
import { UseScenarioContext } from 'serenity-scenario-context';

class Ticket {
    constructor(
        public readonly id: string,
        public readonly status: 'open' | 'resolved',
    ) {}
}

const raiseTicket = (ticket: Ticket, label?: string) =>
    Interaction.where(`#actor raises ticket ${ ticket.id }`, actor => {
        UseScenarioContext.as(actor).add(ticket, ...(label ? [ label ] : []));
    });

const theTicketLabelled = (label: string) =>
    Question.about(`the ticket labelled ${ label }`, actor =>
        UseScenarioContext.as(actor).withType(Ticket).withQualifiers(label).findOne());

const theTicketInTheSpotlight = () =>
    Question.about('the ticket in the spotlight', actor =>
        UseScenarioContext.as(actor).withType(Ticket).findLastUsed());

await actorCalled('Alice')
    .whoCan(UseScenarioContext.using())
    .attemptsTo(
        raiseTicket(new Ticket('TICKET-1', 'open'), 'billing'),
        raiseTicket(new Ticket('TICKET-2', 'open'), 'login'),

        // 'login' was raised last, so it's the one in the spotlight - until
        // something else is added or found, moving it back to the top:
        Ensure.that(theTicketInTheSpotlight(), equals(new Ticket('TICKET-2', 'open'))),
        Ensure.that(theTicketLabelled('billing'), equals(new Ticket('TICKET-1', 'open'))),
    );
```

A few things worth calling out:

- `add`/`withType`/`withQualifiers` never take the actor as an argument -
  like any Serenity/JS `Interaction` or `Question`, `raiseTicket(...)` and
  `theTicketLabelled(...)` are only handed the actor performing or asking
  them once they actually run, via `attemptsTo`/`Ensure.that` - not by the
  code that builds them.
- Qualifiers are optional and free-form: `add(ticket)` on its own is fine
  when there's only ever going to be one `Ticket` around, or when
  `findLastUsed()` is all you'll ever need.
- `UseScenarioContext.using()` with no argument gives the actor a fresh,
  empty `ScenarioContext` of their own; pass an existing `ScenarioContext`
  instance instead when you want several actors to share one (see
  [`test/acceptance/cast.ts`](test/acceptance/cast.ts) for a worked
  example).
