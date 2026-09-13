# Serenity Scenario Context

A type-safe way to share and retrieve scenario state in [Serenity/JS](https://serenity-js.org/).

`serenity-scenario-context` provides two things that make scenario state easier to work with:

1. **Decentralized typing** — capabilities can add their own state without maintaining a central `Notes` type.
2. **Spotlight behavior** — when multiple objects of the same type exist, the most recently used object can be retrieved naturally, while qualifiers allow you to explicitly select another one.

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

### 2. Spotlight behavior

Consider a scenario that creates several tickets:

```ts id="n8w4kc"
CreateTicket.called('Billing problem');
ResolveTicket();

CreateTicket.called('Technical problem');
ResolveTicket();
```

With `ScenarioContext`, the most recently used `Ticket` is automatically in the **spotlight**.

So `ResolveTicket()` can operate on the current ticket without requiring every capability to pass around or invent a new key.

When multiple objects need to be distinguished, qualifiers make the lookup explicit:

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

This gives you both:

* **implicit, convenient access** to the current object;
* **explicit, qualified lookup** when several objects matter.

### Notepad vs. Scenario Context

The two approaches model scenario state differently:

```text id="f3w9qa"
Notepad
    key → value
    centrally typed

ScenarioContext
    type + qualifiers → value
    decentralized
    + spotlight for the latest object
```

`Notepad` is a great choice for small, stable, explicitly named scenario state.

`ScenarioContext` is designed for scenarios where state is more dynamic, multiple objects of the same type are common, or capabilities should contribute state independently.

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

`ScenarioContext` is a **decentralized, type-aware context with spotlight behavior**:

```text id="h4t6zs"
             Scenario Context
                    │
          ┌─────────┴─────────┐
          │                   │
   decentralized          spotlight
      typing               behavior
          │                   │
   type + qualifiers    latest object
```

It keeps scenario state close to the capabilities that produce and consume it, while making the most recently used object naturally available when explicit identification is unnecessary.
