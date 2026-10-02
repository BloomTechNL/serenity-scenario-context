# Serenity Scenario Context

A type-safe way to share and retrieve scenario state in [Serenity/JS](https://serenity-js.org/).

`serenity-scenario-context` provides two things that make scenario state easier to work with:

1. **Decentralized typing** — capabilities can add their own state without maintaining a central `Notes` type.
2. **Multi-instance collision handling** — when a scenario holds several objects of the same type, they don't collide: qualifiers tell them apart, collisions are caught instead of silently overwritten, and ambiguous lookups can be made to fail loudly.

## Why Scenario Context?

Serenity/JS `Notepad` works well when scenario state is small and explicitly named:

```ts id="5h1q3c"
interface Notes {
    customer: Customer;
    order: Order;
}

notes<Notes>().set('customer', customer);
notes<Notes>().set('order', order);
```

As a test suite grows, two challenges can emerge.

### 1. Decentralized typing

A shared `Notes` type can become a central registry of unrelated scenario state:

```ts id="4k8v5n"
interface Notes {
    customer: Customer;
    order: Order;
    payment: Payment;
    session: Session;
    // ...
}
```

A capability that introduces `Payment` now needs to modify a shared type.

With `ScenarioContext`, the capability can simply register what it produces:

```ts id="x6r2mv"
context.add(payment);
```

and consumers retrieve it by type:

```ts id="q3m7ds"
context.find(Payment);
```

There is no central schema containing every possible type of scenario state.

### 2. Multiple instances of the same type

Looking state up by type has an obvious catch: what if a scenario needs two objects of the same type?

```ts id="n8w4kc"
CreateTicket.called('Billing problem');
CreateTicket.called('Technical problem');
```

Both are a `Ticket`. A context keyed by type alone would have to either overwrite the first one or pick one arbitrarily — and the test would quietly operate on the wrong ticket.

`ScenarioContext` makes the collision explicit. Instances of the same type are told apart by **qualifiers**:

```ts id="v2p6yx"
context.add(billingTicket, {
    label: 'billing',
});

context.add(technicalTicket, {
    label: 'technical',
});
```

```ts id="r7k4mc"
context.find(Ticket, {
    label: 'billing',
});
```

The rules keep collisions from going unnoticed:

* Every instance of a type is qualified by the same set of keys (here: `label`). Adding a `Ticket` with different keys throws `UnexpectedQualifierKeysError`.
* Adding a second instance with exactly the same qualifiers throws `DuplicateQualifiersError`, rather than overwriting the first. If overwriting *is* what you want, use [`addOrReplace`](#replacing-a-value-in-place).
* Looking up an unknown qualifier key throws `UnknownQualifierKeyError`, and looking up something that isn't there throws `PieceNotFoundError`.

#### Resolving ambiguity: you choose how strict to be

A lookup only needs as many qualifier keys as it takes to tell the instance apart from the rest. When it's still ambiguous, you decide what happens:

```ts id="k3d8ua"
// Strict: throws MultiplePiecesFoundError if more than one Ticket matches.
context.findOne(Ticket);

// Convenient: returns the most recently used matching Ticket.
context.find(Ticket);
```

`find` falls back to the **spotlight**: the most recently added or looked-up instance of a type. This lets a capability like `ResolveTicket()` operate on "the current ticket" without every step having to pass around a key:

```ts id="w5t1ge"
CreateTicket.called('Billing problem');
ResolveTicket();                         // resolves the billing ticket

CreateTicket.called('Technical problem');
ResolveTicket();                         // resolves the technical ticket
```

This gives you:

* **explicit, qualified lookup** when several objects matter;
* **strict lookup** (`findOne`) when an ambiguous match would be a bug;
* **implicit, convenient access** to the current object (`find`) when it wouldn't.

### Notepad vs. Scenario Context

The two approaches model scenario state differently:

```text id="f3w9qa"
Notepad
    key → value
    centrally typed

ScenarioContext
    type + qualifiers → value
    decentralized
    + qualifiers for multiple instances of a type
    + collisions detected, ambiguity optionally strict
```

`Notepad` is a great choice for small, stable, explicitly named scenario state.

`ScenarioContext` is designed for scenarios where state is more dynamic, multiple objects of the same type are common (and must not collide), or capabilities should contribute state independently.

## Basic usage

Give an actor access to a context:

```ts id="j5s8nd"
const context = new ScenarioContext();

actorCalled('Alice')
    .whoCan(
        UseScenarioContext.using(context)
    );
```

Store an object:

```ts id="p2v6rk"
UseScenarioContext
    .as(actor)
    .add(customer);
```

Retrieve it:

```ts id="z9c4bw"
const customer =
    UseScenarioContext
        .as(actor)
        .find(Customer);
```

## Replacing a value in place

`add` throws if a piece qualified exactly the same already exists. When you'd rather overwrite it than be told it's already there, use `addOrReplace`:

```ts id="d8n3wl"
UseScenarioContext
    .as(actor)
    .addOrReplace(updatedCustomer, { id: 'CUST-1' });
```

If no piece matches those qualifiers yet, it's added as usual.

## Sharing between actors

A context can be shared by multiple actors:

```ts id="m7q2fx"
const context = new ScenarioContext();

alice.whoCan(UseScenarioContext.using(context));
bob.whoCan(UseScenarioContext.using(context));
```

State added by one actor can therefore be retrieved by another.

## In short

`Notepad` is a **named scenario state store**.

`ScenarioContext` is a **decentralized, type-aware context that handles multiple instances of the same type**:

```text id="h4t6zs"
             Scenario Context
                    │
          ┌─────────┴─────────┐
          │                   │
   decentralized         multi-instance
      typing              collisions
          │                   │
   type + qualifiers    qualify, detect,
                        or use the spotlight
```

It keeps scenario state close to the capabilities that produce and consume it, while making sure that several objects of the same type can coexist without colliding — and that the most recently used one is still naturally available when explicit identification is unnecessary.
