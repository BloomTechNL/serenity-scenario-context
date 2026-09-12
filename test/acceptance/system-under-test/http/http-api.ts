import { ErrorRepresentation } from './error-representation';
import { HttpResponse } from './http-response';

/**
 * An HTTP-like API: something a caller can `get` from and `post` to, the
 * same way it would talk to a real HTTP service, but served entirely
 * in-process - no networking, no serialisation, no port to stand up.
 *
 * This is the seam between "the test" and "the system under test": tests
 * exercise the {@link ../../src | ScenarioContext ability} directly, but
 * anything that looks like application behaviour - raising a ticket,
 * resolving it, recording someone's contact details - goes through here
 * first, the same way it would against a real backend.
 *
 * Implementations behave like a small REST API: a `2xx` status with a
 * representation of a resource on success, a `4xx` status with an
 * {@link ErrorRepresentation} when the request doesn't make sense - the
 * resource doesn't exist, or already does, or the caller isn't logged in.
 *
 * `headers` mirrors the one real HTTP header this fake API cares about:
 * `Authorization`, carrying a `Bearer <token>` from a prior login - the
 * same way a real HTTP client would attach it, rather than a request
 * proving who it's from some other way.
 */
export interface HttpApi {
    get<ResponseBody>(path: string, headers?: Record<string, string>): HttpResponse<ResponseBody | ErrorRepresentation>;
    post<ResponseBody>(path: string, body?: unknown, headers?: Record<string, string>): HttpResponse<ResponseBody | ErrorRepresentation>;
}
