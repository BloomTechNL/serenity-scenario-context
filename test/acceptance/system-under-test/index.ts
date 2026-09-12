/**
 * A fake "system under test": a small collection of backends, each exposed
 * over an HTTP-like {@link HttpApi} rather than as plain objects a test
 * could reach into and mutate directly.
 *
 * This is what keeps `test/acceptance` honest: the acceptance tests exist
 * to exercise `UseScenarioContext`, a Serenity/JS actor `Ability` - not to
 * quietly become the system they're supposed to be driving. Interactions
 * and questions talk to whatever's in here the same way they'd talk to a
 * real backend - by making a request and getting a representation back -
 * and only then decide what, if anything, is worth remembering in the
 * actor's own {@link ../src/ScenarioContext | ScenarioContext}.
 */
export * from './http/index';
export * from './support-desk/index';
