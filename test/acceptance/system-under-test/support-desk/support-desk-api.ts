import { randomUUID } from 'node:crypto';

import { ErrorRepresentation, HttpApi, HttpResponse } from '../http/index';

export type TicketStatus = 'open' | 'resolved';
export type TicketPriority = 'normal' | 'urgent';

export interface TicketRepresentation {
    id: string;
    subject: string;
    priority: TicketPriority;
    status: TicketStatus;
}

interface NewTicket {
    subject: string;
    priority?: TicketPriority;
}

interface Credentials {
    username: string;
    password: string;
}

export interface AccountRepresentation {
    username: string;
}

export interface SessionRepresentation {
    token: string;
    username: string;
}

export class SupportDeskApi implements HttpApi {

    private static readonly shared = new SupportDeskApi();

    static instance(): SupportDeskApi {
        return SupportDeskApi.shared;
    }

    private readonly tickets = new Map<string, TicketRepresentation>();
    private readonly registeredAgents = new Map<string, string>();
    private readonly sessions = new Map<string, string>();

    get<ResponseBody>(path: string, headers: Record<string, string> = {}): HttpResponse<ResponseBody | ErrorRepresentation> {
        return this.route(path, undefined, headers) as HttpResponse<ResponseBody | ErrorRepresentation>;
    }

    post<ResponseBody>(path: string, body?: unknown, headers: Record<string, string> = {}): HttpResponse<ResponseBody | ErrorRepresentation> {
        return this.route(path, body, headers) as HttpResponse<ResponseBody | ErrorRepresentation>;
    }

    private route(path: string, body: unknown, headers: Record<string, string>): HttpResponse<unknown> {
        const { pathname, searchParams } = new URL(path, 'http://localhost');

        if (pathname === '/register') {
            return this.register(body as Partial<Credentials>);
        }

        if (pathname === '/login') {
            return this.login(body as Partial<Credentials>);
        }

        const authenticationError = this.requireSession(headers);
        if (authenticationError) {
            return authenticationError;
        }

        if (pathname === '/tickets/search') {
            return this.searchTicketsBySubject(searchParams.get('subject'), searchParams.get('testId'));
        }

        const ticket = /^\/tickets\/([^/]+)$/.exec(pathname);
        if (ticket) {
            return this.found(this.tickets.get(decodeURIComponent(ticket[1])), `No ticket with id ${ ticket[1] }`);
        }

        if (pathname === '/tickets') {
            return this.createTicket(body as NewTicket);
        }

        const resolveTicket = /^\/tickets\/([^/]+)\/resolve$/.exec(pathname);
        if (resolveTicket) {
            return this.resolveTicket(decodeURIComponent(resolveTicket[1]));
        }

        const changeTicketSubject = /^\/tickets\/([^/]+)\/subject$/.exec(pathname);
        if (changeTicketSubject) {
            return this.changeTicketSubject(decodeURIComponent(changeTicketSubject[1]), body as Partial<NewTicket>);
        }

        return { status: 404, body: { error: `No such endpoint: ${ path }` } };
    }

    private register(payload: Partial<Credentials> = {}): HttpResponse<AccountRepresentation | ErrorRepresentation> {
        const { username, password } = payload;

        if (! username || ! password) {
            return { status: 400, body: { error: 'Registering needs both a username and a password' } };
        }

        if (this.registeredAgents.has(username)) {
            return { status: 409, body: { error: `An agent called ${ username } is already registered` } };
        }

        this.registeredAgents.set(username, password);

        return { status: 201, body: { username } };
    }

    private login(payload: Partial<Credentials> = {}): HttpResponse<SessionRepresentation | ErrorRepresentation> {
        const { username, password } = payload;

        if (! username || ! password) {
            return { status: 400, body: { error: 'A login needs both a username and a password' } };
        }

        if (this.registeredAgents.get(username) !== password) {
            return { status: 401, body: { error: 'Invalid username or password' } };
        }

        const token = randomUUID();
        this.sessions.set(token, username);

        return { status: 200, body: { token, username } };
    }

    private requireSession(headers: Record<string, string>): HttpResponse<ErrorRepresentation> | undefined {
        const authorization = headers.Authorization ?? '';
        const [ scheme, token ] = authorization.split(' ');

        if (scheme !== 'Bearer' || ! token || ! this.sessions.has(token)) {
            return { status: 401, body: { error: 'Login required' } };
        }

        return undefined;
    }

    private createTicket(payload: NewTicket = {} as NewTicket): HttpResponse<TicketRepresentation | ErrorRepresentation> {
        const { subject, priority = 'normal' } = payload;

        if (! subject) {
            return { status: 400, body: { error: 'A ticket needs at least a subject' } };
        }

        const ticket: TicketRepresentation = { id: randomUUID(), subject, priority, status: 'open' };
        this.tickets.set(ticket.id, ticket);

        return { status: 201, body: ticket };
    }

    private searchTicketsBySubject(
        subject: string | null,
        testId: string | null,
    ): HttpResponse<TicketRepresentation[] | ErrorRepresentation> {
        if (! subject) {
            return { status: 400, body: { error: 'A ticket search needs a subject to search for' } };
        }

        const needle = subject.toLowerCase();
        const matches = [ ...this.tickets.values() ].filter(ticket =>
            ticket.subject.toLowerCase().includes(needle) && (! testId || ticket.subject.includes(testId)),
        );

        return { status: 200, body: matches };
    }

    private resolveTicket(id: string): HttpResponse<TicketRepresentation | ErrorRepresentation> {
        const ticket = this.tickets.get(id);

        if (! ticket) {
            return { status: 404, body: { error: `No ticket with id ${ id }` } };
        }

        const resolved: TicketRepresentation = { ...ticket, status: 'resolved' };
        this.tickets.set(id, resolved);

        return { status: 200, body: resolved };
    }

    private changeTicketSubject(id: string, payload: Partial<NewTicket> = {}): HttpResponse<TicketRepresentation | ErrorRepresentation> {
        const { subject } = payload;

        if (! subject) {
            return { status: 400, body: { error: 'A ticket needs at least a subject' } };
        }

        const ticket = this.tickets.get(id);

        if (! ticket) {
            return { status: 404, body: { error: `No ticket with id ${ id }` } };
        }

        const updated: TicketRepresentation = { ...ticket, subject };
        this.tickets.set(id, updated);

        return { status: 200, body: updated };
    }

    private found<Representation>(
        representation: Representation | undefined,
        errorMessage: string,
    ): HttpResponse<Representation | ErrorRepresentation> {
        return representation
            ? { status: 200, body: representation }
            : { status: 404, body: { error: errorMessage } };
    }
}
