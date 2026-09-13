export interface HttpResponse<Body> {
    readonly status: number;
    readonly body: Body;
}
