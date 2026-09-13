# serenity-scenario-context

A [Serenity/JS](https://serenity-js.org) `Ability` that gives actors an
advanced form of notes: a **scenario context** of typed, qualified pieces of
information, where the piece most recently added or looked up is always
"in the spotlight".

## Why use this instead of `Notes`?

Serenity/JS already ships an `Ability` for remembering things: `TakeNotes`,
backed by a `Notepad<Notes>`. It's a fine choice for a lot of scenarios -
`UseScenarioContext` earns its place instead for two reasons.

### 1. No single "god" notes type to maintain

A `Notepad` is typed by one `Notes` interface, declared up front, that has
to know about every single thing any scenario might ever want to remember:

```ts
interface Notes {
    ticket: Ticket;
    session: SessionRepresentation;
    credentials: LoginCredentialContext;
    // ...and everything else, forever
}
```

Every new kind of thing worth remembering means growing this one, shared
interface - even when it has nothing to do with the scenarios that already
use it. `UseScenarioContext` needs no such thing:

```ts
UseScenarioContext.as(actor).add(ticket, { label: 'billing' });
UseScenarioContext.as(actor).add(session);
```

Add any object of any type, the moment you first need to remember it - it's
found again later by its own runtime type, not a key you had to register
somewhere central first.

### 2. Omit the qualifier, and get back whatever you used last - for specs that read naturally

A `Notepad` needs a full, exact key every single time you want something
back - there's no such thing as "whichever one I was just working with" or
"the ticket, if there's only one". Every retrieval has to name its key in
full, whether or not there was ever any ambiguity to resolve.

Real specs don't talk like that. "The actor raises a ticket, then resolves
it" doesn't restate *which* ticket the second time - "it" defaults to
whichever one is topical, the one just raised. `UseScenarioContext` lets
your step definitions read the same way, because a qualifier is something
you can supply *or leave out*, on both ends:

```ts
const raiseTicket = (ticket: Ticket, label?: string) =>
    Interaction.where(`#actor raises a ticket`, actor =>
        UseScenarioContext.as(actor).add(ticket, { label: label ?? randomUUID() }));

const resolveTicket = (label?: string) =>
    Interaction.where(`#actor resolves a ticket`, actor => {
        const qualifiers: Qualifiers = label ? { label } : {};
        const found = UseScenarioContext.as(actor).findPiece(Ticket, qualifiers);
        found.replace(new Ticket(found.value.id, 'resolved'));
    });
```

```ts
actor.attemptsTo(
    raiseTicket(ticket),   // no label to invent
    resolveTicket(),       // "the ticket" - resolves whichever was just raised
);
```

Label a `Ticket` when a scenario genuinely needs to tell several of them
apart later, and leave it unlabelled the rest of the time - either way, "the
one I mean" is resolved for you, the same way it would be in a sentence.
Reach for `UseScenarioContext` once you'd rather write specs this way than
invent and thread a key through every step that touches a value.

## Usage

### Remembering something

```ts
UseScenarioContext.as(actor).add(ticket, { label: 'billing' });
```

`add` takes the value and a `qualifiers` object describing it - any number
of named `key: value` pairs, entirely up to you: an id, a label, a status,
several of those at once - whatever makes it possible to tell this value
apart from others of the same type later on.

### Recalling something

```ts
// when the value itself is all you need:
const ticket = UseScenarioContext.as(actor).find(Ticket, { label: 'billing' });

// when you'll want to swap it out afterwards:
const found = UseScenarioContext.as(actor).findPiece(Ticket, { label: 'billing' });
found.replace(resolvedTicket); // swaps it out for resolvedTicket, in place
```

`find` and `findPiece` both search for a value of the given type, qualified
by whichever keys you pass in:

- give no qualifiers at all, and you get back whichever value of that type
  was added or found most recently - "the one in the spotlight";
- name some keys, but not every key that type takes, and you get back
  whichever matching value is currently in the spotlight;
- name every key that type takes, and the match is unambiguous - there's
  never a need to pick between several equally good candidates;
- name a key that isn't one of that type's qualifier keys, and it throws
  rather than searching for something that can't exist.

The only difference between the two: `find` returns the value itself, which
is what you want most of the time. `findPiece` returns a handle on it
instead - call `.value` to read it, or `.replace(newValue)` to swap it out
for something new, in place, without losing track of whichever qualifiers
it was found by. Reach for `findPiece` only when you're about to replace
what you found.

Finding a value - with either method - puts it back "in the spotlight", so
that a later, less specific search is more likely to find it again.

### Naming more than one key

Because qualifiers are named, you can give a value several of them and
later search by just the one you care about, without needing to know or
supply the others:

```ts
UseScenarioContext.as(actor).add(ticket, { label: 'billing', priority: 'urgent' });

// finds it by priority alone, no label required
const urgentTicket = UseScenarioContext.as(actor).find(Ticket, { priority: 'urgent' });
```

### Qualifying values consistently

Every value of a given type needs to be qualified by the same *set of
keys*, whatever that set turns out to be for the first one you add. So if
some `Ticket`s in your scenario are labelled and others aren't, give the
unlabelled ones a `label` too - a random, unique one nobody's likely to
search for - rather than leaving the key out:

```ts
import { randomUUID } from 'node:crypto';

const raiseTicket = (ticket: Ticket, label?: string) =>
    Interaction.where(`#actor raises ticket ${ ticket.id }`, actor =>
        UseScenarioContext.as(actor).add(ticket, { label: label ?? randomUUID() }));
```

That way, labelled and unlabelled tickets can coexist: every `Ticket` ends
up qualified by the same `label` key, whether or not the caller supplied a
meaningful value for it. If every value of a type you ever add either
always has a label or never does, you don't need to think about this at
all.

### Sharing a scenario context across actors

```ts
const sharedContext = new ScenarioContext();

actorCalled('Alice').whoCan(UseScenarioContext.using(sharedContext));
actorCalled('Bob').whoCan(UseScenarioContext.using(sharedContext));
```

`UseScenarioContext.using()` with no argument gives an actor a fresh, empty
context of their own. Pass an existing `ScenarioContext` instead when you
want several actors - or a whole `Cast` - to share one.
