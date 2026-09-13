import { Constructor } from './constructor';
import { Qualifiers } from './qualifiers';
import { ScenarioContextPart } from './scenario-context-part';
import { ScenarioContextPiece } from './scenario-context-piece';

/**
 * Holds the {@link ScenarioContextPiece} objects recorded during a scenario,
 * partitioned by type into one {@link ScenarioContextPart} per type.
 */
export class ScenarioContext {

    private readonly parts = new Map<Constructor<unknown>, ScenarioContextPart<unknown>>();

    /**
     * Puts `value`, qualified by the given `qualifiers`, on top of the part
     * of this context for `value`'s type.
     *
     * @returns the {@link ScenarioContextPiece} that was created, for
     *  convenience.
     *
     * @throws Error
     *  if `value`'s type has already been added with a different *set of
     *  qualifier keys*, or if a piece of that type already exists in this
     *  context with this exact combination of qualifiers - see
     *  {@link ScenarioContextPart}.
     */
    add<Value extends object>(value: Value, qualifiers: Qualifiers = {}): ScenarioContextPiece<Value> {
        const piece = new ScenarioContextPiece(value, qualifiers);

        this.partFor(constructorOf(value) as Constructor<Value>).add(piece);

        return piece;
    }

    /**
     * @returns the {@link ScenarioContextPart} holding every piece of
     *  `type`, creating an empty one if this context doesn't hold any piece
     *  of that type yet.
     */
    partFor<Value>(type: Constructor<Value>): ScenarioContextPart<Value> {
        let part = this.parts.get(type) as ScenarioContextPart<Value> | undefined;

        if (! part) {
            part = new ScenarioContextPart<Value>(type);
            this.parts.set(type, part as ScenarioContextPart<unknown>);
        }

        return part;
    }
}

function constructorOf(value: unknown): Constructor<unknown> {
    return Object(value).constructor as Constructor<unknown>;
}
