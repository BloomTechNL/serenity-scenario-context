/**
 * The set of named key/value pairs used to tell apart several
 * {@link ScenarioContextPiece} objects holding values of the same type -
 * e.g. `{ id: 'TICKET-1' }`, or `{ label: 'urgent', priority: 'high' }`.
 *
 * Every value of a given type must be qualified by the same fixed set of
 * keys, whatever that turns out to be for the first one added - see
 * {@link ScenarioContextPart}. Finding a value again only needs as many of
 * those keys as are necessary to tell it apart from the rest.
 */
export type Qualifiers = Record<string, string>;
