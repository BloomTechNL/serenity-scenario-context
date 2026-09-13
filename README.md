# Serenity Scenario Context

A decentralized, type-safe way to share scenario state in [Serenity/JS](https://serenity-js.org/).

`serenity-scenario-context` lets actors store and retrieve objects by their **type** and, when needed, by **qualifiers** — without maintaining a central `Notes` interface.

## Why?

Serenity/JS `Notepad` is excellent for explicit, stable scenario state:

```ts
interface Notes {
    customer: Customer;
    order: Order;
}

notes<Notes>().set('customer', customer);
notes<Notes>().set('order', order);
```

As a test suite grows, the `Notes` type can become a central registry of unrelated scenario state:

```ts
interface Notes {
    customer: Customer;
    order: Order;
    payment: Payment;
    session: Session;
    // ...
}
```

A capability that introduces a new kind of state now has to modify a shared type.

`ScenarioContext` takes a decentralized approach:

```ts
context.add(payment);
```

and later:

```ts
context.find(Payment);
```

The capability that produces the state owns its type. No central schema is required.

## Why not just use Notepad?

You absolutely can.

Use `Notepad` when your scenario state is small and explicit:

```ts
notes<Notes>().get('order');
```

`ScenarioContext` becomes useful when your scenarios contain many objects, multiple instances of the same type, or independently developed capabilities.

For example:

```ts
context.add(billingTicket, {
    label: 'billing',
});

context.add(technicalTicket, {
    label: 'technical',
});
```

Retrieve them by type and qualifier:

```ts
context.find(Ticket, {
    label: 'billing',
});
```

The difference is architectural:

```text
Notepad
    key → value
    central type

ScenarioContext
    type + qualifiers → value
    decentralized state
```

`Notepad` asks:

> "What key did I use for this?"

`ScenarioContext` asks:

> "What kind of object do I need, and which one?"

## Basic usage

Give an actor access to a context:

```ts
const context = new ScenarioContext();

actorCalled('Alice')
    .whoCan(
        UseScenarioContext.using(context)
    );
```

Store an object:

```ts
UseScenarioContext
    .as(actor)
    .add(customer);
```

Retrieve it:

```ts
const customer =
    UseScenarioContext
        .as(actor)
        .find(Customer);
```

## The spotlight

When a scenario works with one object of a type at a time, the latest object can be retrieved without a qualifier:

```ts
CreateTicket.called('Billing problem');

ResolveTicket();
```

When multiple objects exist, use qualifiers to make the lookup explicit:

```ts
context.find(Ticket, {
    label: 'billing',
});
```

This gives you concise code when the context is unambiguous and explicit lookup when it isn't.

## Sharing between actors

A context can be shared by multiple actors:

```ts
const context = new ScenarioContext();

alice.whoCan(UseScenarioContext.using(context));
bob.whoCan(UseScenarioContext.using(context));
```

State added by one actor can therefore be retrieved by another.

## When should I use it?

Use `ScenarioContext` when:

* scenario state is dynamic;
* multiple instances of a type exist;
* qualifiers are useful for identifying objects;
* capabilities should contribute state independently;
* you want to avoid a central `Notes` type.

For small, stable scenario state, native Serenity/JS `Notepad` may be the simpler choice.

## In short

`Notepad` is a great **named scenario state store**.

`ScenarioContext` is a **decentralized object context**:

```text
type + qualifiers → object
```

It is designed to keep scenario state close to the capabilities that produce and consume it — without requiring a central schema for everything that can exist in a scenario.
