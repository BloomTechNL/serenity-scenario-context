/**
 * A constructor function for `Value`, used to identify what type of object
 * a {@link ScenarioContextSearcher} should look for.
 */
export interface Constructor<Value> {
    new (...args: any[]): Value;
}
