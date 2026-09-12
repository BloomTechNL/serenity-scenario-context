/**
 * The body an `HttpApi` hands back when a request doesn't make sense - e.g.
 * the resource it names doesn't exist, or already does. Always paired with
 * a `4xx` {@link HttpResponse#status}.
 */
export interface ErrorRepresentation {
    error: string;
}
