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
| Retrieving without an exact key   | not possible                                | `find(Type).value`                                               |
| Retrieving something specific     | `notes().get('the-exact-key')`             | `find(Type, ...qualifiers).value`                                 |
| Ambiguity (two things could match)| whichever one you happen to `get`           | give it enough qualifiers and it's unambiguous by construction   |

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
UseScenarioContext.as(actor).find(Ticket).value;

// the one labelled 'billing', found unambiguously by type + qualifier -
// note that finding it also puts it back in the spotlight:
UseScenarioContext.as(actor).find(Ticket, 'billing').value;
```

If your scenario only ever needs one value per name, reach for `Notes` -
it's simpler. Reach for `ScenarioContext` once you have several instances of
the same domain type in play and want to recall them the way you'd talk
about them - by type, and by how you'd describe or most recently used one -
rather than by a key invented purely for storage.

## The building blocks

- [`ScenarioContextPiece`](src/scenario-context-piece.ts) - pairs an
  arbitrary domain object (`value`) with a set of free-form string
  qualifiers. Its qualifiers never change once set, but its value can be
  swapped out via `replace(newValue)` - in place, without disturbing its
  identity or its position in whichever `ScenarioContextPart` holds it.
  This is what `find` (below) returns.
- [`ScenarioContextPart`](src/scenario-context-part.ts) - holds every piece
  of *one particular type*, as an ordered stack of its own: the piece that
  was put on top most recently is what a search prefers when several match.
  It's also where the two invariants that type is held to live:
  - every piece of that type is qualified by the same, fixed *number* of
    qualifiers - however many the first piece of that type was added with;
  - no two pieces of that type carry the exact same *combination* of
    qualifiers - the combination acts like a composite key.

  Both exist so that a search using exactly that many qualifiers can never
  be ambiguous, which is what lets `find` (below) decide how to resolve a
  search on your behalf. A consequence worth knowing: if some `Ticket`s in
  your scenario are labelled and others aren't, they still all need the
  *same number* of qualifiers - see the callout under Usage below for how
  to handle that.

  Because a part only ever holds pieces of one type, it can resolve a
  search entirely on its own - no separate "searcher" needed. There's a
  single way in: `find(...qualifiers)`, which decides how to resolve the
  search based on how many `qualifiers` you give it relative to the type's
  fixed qualifier count:
  - given exactly that many, there can be at most one match - unambiguous
    by construction, since no two pieces of the same type ever share a
    combination of qualifiers - so `find` returns it;
  - given fewer, several pieces might still match, so whichever one was put
    on top of the part most recently is returned, no questions asked;
  - given more, it throws outright, since no piece could possibly have
    that many qualifiers.

  Handy for something like "the ticket labelled `label`, when `label` was
  given, or the ticket in the spotlight otherwise" without spelling out the
  `? :` every time. Either way, the piece that's found is put back on top
  of the part - "in the spotlight" - so that whatever you search for next,
  without being overly specific, tends to find what you were just working
  with. And either way, what you get back is the `ScenarioContextPiece`
  itself, not just its value - so a caller that wants to update it, having
  just found it, can call `replace(newValue)` right on the spot: read
  `piece.value` to get at the value, or `piece.replace(newValue)` to swap
  it out for a new one - e.g. replacing a `Ticket` that's still `'open'`
  with the `'resolved'` version of itself, without losing track of it under
  whichever qualifiers it was raised with.
- [`ScenarioContext`](src/scenario-context.ts) - little more than a registry
  of one `ScenarioContextPart` per type: `add(value, ...qualifiers)` builds
  a piece and puts it on top of the right part, creating that part on first
  use, and `partFor(type)` hands out the part for a given type.
- [`UseScenarioContext`](src/use-scenario-context.ts) - the Serenity/JS
  `Ability`. Actors use it to `add` domain objects, qualified however you
  like, and `find(Type, ...qualifiers)` to search for one again - it just
  looks up the `ScenarioContextPart` for `Type` and calls `find` on it, so
  there's no separate step to get at the part yourself.
- [`scenario-context-errors.ts`](src/scenario-context-errors.ts) - a named
  `Error` subclass for each way `add`/`find` can fail
  (`UnexpectedQualifierCountError`, `DuplicateQualifiersError`,
  `TooManyQualifiersError`, `PieceNotFoundError`), so a caller that cares can
  tell them apart with `instanceof` instead of matching on message text.

## Usage

```ts
import { randomUUID } from 'node:crypto';
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
        // every Ticket gets exactly one qualifier - the label it was given,
        // or an anonymous one nobody's likely to search for - so labelled
        // and unlabelled tickets can still coexist (see the callout below).
        UseScenarioContext.as(actor).add(ticket, label ?? randomUUID());
    });

const resolveTicketLabelled = (label: string) =>
    Interaction.where(`#actor resolves the ticket labelled ${ label }`, actor => {
        const found = UseScenarioContext.as(actor).find(Ticket, label);

        // same id and label, new status - and it stays right where it was:
        found.replace(new Ticket(found.value.id, 'resolved'));
    });

const theTicketLabelled = (label: string) =>
    Question.about(`the ticket labelled ${ label }`, actor =>
        UseScenarioContext.as(actor).find(Ticket, label).value);

const theTicketInTheSpotlight = () =>
    Question.about('the ticket in the spotlight', actor =>
        UseScenarioContext.as(actor).find(Ticket).value);

await actorCalled('Alice')
    .whoCan(UseScenarioContext.using())
    .attemptsTo(
        raiseTicket(new Ticket('TICKET-1', 'open'), 'billing'),
        raiseTicket(new Ticket('TICKET-2', 'open'), 'login'),

        // 'login' was raised last, so it's the one in the spotlight - until
        // something else is added or found, moving it back to the top:
        Ensure.that(theTicketInTheSpotlight(), equals(new Ticket('TICKET-2', 'open'))),
        Ensure.that(theTicketLabelled('billing'), equals(new Ticket('TICKET-1', 'open'))),

        resolveTicketLabelled('billing'),
        Ensure.that(theTicketLabelled('billing'), equals(new Ticket('TICKET-1', 'resolved'))),
    );
```

A few things worth calling out:

- `add`/`find` never take the actor as an argument -
  like any Serenity/JS `Interaction` or `Question`, `raiseTicket(...)` and
  `theTicketLabelled(...)` are only handed the actor performing or asking
  them once they actually run, via `attemptsTo`/`Ensure.that` - not by the
  code that builds them.
- Every `Ticket` here is qualified by exactly one qualifier, whether or not
  the caller supplied a `label` - because the *number* of qualifiers a type
  is qualified by is fixed the moment the first one is added (see
  [`ScenarioContext`](#the-building-blocks) above). If `raiseTicket` added
  `ticket` with *no* qualifiers whenever `label` was omitted, the very
  first unlabelled ticket in a scenario would fix the count at `0` - and
  every labelled one raised afterwards (or before) would then be rejected,
  and vice versa. Generating an anonymous qualifier when none is given
  keeps the count consistently at `1` either way; [the real
  `raiseTicket`](test/acceptance/interactions/raise-ticket.ts) in this
  repo's acceptance tests does exactly this. If every `Ticket` you ever add
  either always has a label or never does, you don't need to think about
  this at all - the count is simply whatever the first one happens to be.
- Qualifiers are optional and free-form: `add(ticket)` on its own is fine
  when there's only ever going to be one `Ticket` around, or when
  `find(Ticket)` - with no qualifiers - is all you'll ever need.
- `UseScenarioContext.using()` with no argument gives the actor a fresh,
  empty `ScenarioContext` of their own; pass an existing `ScenarioContext`
  instance instead when you want several actors to share one (see
  [`test/acceptance/cast.ts`](test/acceptance/cast.ts) for a worked
  example).
