import { ErrorRepresentation } from './error-representation';
import { HttpResponse } from './http-response';

export interface HttpApi {
    get<ResponseBody>(path: string, headers?: Record<string, string>): HttpResponse<ResponseBody | ErrorRepresentation>;
    post<ResponseBody>(path: string, body?: unknown, headers?: Record<string, string>): HttpResponse<ResponseBody | ErrorRepresentation>;
}
