/**
 * A minimal, in-process stand-in for an HTTP response: a status code and a
 * JSON-like body - the same shape a real HTTP client would hand back after
 * parsing a response, just without an actual network round trip.
 */
export interface HttpResponse<Body> {
    readonly status: number;
    readonly body: Body;
}
