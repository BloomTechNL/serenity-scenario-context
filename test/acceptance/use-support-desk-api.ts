import { Ability } from '@serenity-js/core';

import { ErrorRepresentation, HttpApi, HttpResponse } from './system-under-test/index';

export class UseSupportDeskApi extends Ability {

    static using(api: HttpApi): UseSupportDeskApi {
        return new UseSupportDeskApi(api);
    }

    private token: string | undefined;

    constructor(private readonly api: HttpApi) {
        super();
    }

    rememberSessionToken(token: string): void {
        this.token = token;
    }

    get<ResponseBody>(path: string): ResponseBody {
        return this.unwrap(this.api.get<ResponseBody>(path, this.headers()), 200, `GET ${ path }`);
    }

    post<ResponseBody>(path: string, body?: unknown, expectedStatus = 201): ResponseBody {
        return this.unwrap(this.api.post<ResponseBody>(path, body, this.headers()), expectedStatus, `POST ${ path }`);
    }

    private headers(): Record<string, string> {
        return this.token
            ? { Authorization: `Bearer ${ this.token }` }
            : {};
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
