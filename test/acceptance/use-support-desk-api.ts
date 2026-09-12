import { Ability } from '@serenity-js/core';

import { ErrorRepresentation, HttpApi, HttpResponse } from './system-under-test/index';

/**
 * An `Ability` that lets a Serenity/JS actor talk to the fake
 * `system-under-test`, over its HTTP-like `HttpApi` - keeping "the test"
 * and "the system it's driving" as separate here as they'd be in a real
 * end-to-end test, rather than letting interactions reach into the system's
 * objects directly.
 *
 * It mirrors how a real HTTP client is used in a Screenplay Pattern test: a
 * request is made, a status code comes back, and the caller decides what to
 * do about anything other than the status it expected - here, by failing
 * loudly, the same way `ScenarioContextSearcher` does when its own
 * assumptions are violated.
 */
export class UseSupportDeskApi extends Ability {

    static using(api: HttpApi): UseSupportDeskApi {
        return new UseSupportDeskApi(api);
    }

    constructor(private readonly api: HttpApi) {
        super();
    }

    /**
     * Performs a `GET` request, returning the response body.
     *
     * @throws Error
     *  if the response status isn't 200.
     */
    get<ResponseBody>(path: string): ResponseBody {
        return this.unwrap(this.api.get<ResponseBody>(path), 200, `GET ${ path }`);
    }

    /**
     * Performs a `POST` request, returning the response body.
     *
     * @throws Error
     *  if the response status doesn't match `expectedStatus` (`201`, unless
     *  told otherwise).
     */
    post<ResponseBody>(path: string, body?: unknown, expectedStatus = 201): ResponseBody {
        return this.unwrap(this.api.post<ResponseBody>(path, body), expectedStatus, `POST ${ path }`);
    }

    private unwrap<ResponseBody>(
        response: HttpResponse<ResponseBody | ErrorRepresentation>,
        expectedStatus: number,
        requestLine: string,
    ): ResponseBody {
        if (response.status !== expectedStatus) {
            const message = isErrorRepresentation(response.body)
                ? response.body.error
                : `unexpected status ${ response.status }`;

            throw new Error(`${ requestLine } failed: ${ message }`);
        }

        return response.body as ResponseBody;
    }
}

function isErrorRepresentation(body: unknown): body is ErrorRepresentation {
    return typeof body === 'object' && body !== null && 'error' in body;
}
