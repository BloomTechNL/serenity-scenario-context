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

/**
 * A fake "support desk" system, exposed the same way a real one would be:
 * over an HTTP-like API of resources - tickets, and the agent accounts
 * needed to get at them - rather than as plain objects the tests can reach
 * into and mutate directly.
 *
 * Everything other than `/register` and `/login` requires a valid session,
 * the same way a real support desk wouldn't let an anonymous caller raise,
 * resolve or search for tickets.
 *
 * There's no real networking, framework or persistence here - `get`/`post`
 * are plain, synchronous, in-memory calls - but as far as anything calling
 * them is concerned, it behaves like a small REST API: a request comes in,
 * gets routed to a resource, and comes back with a status code and a body.
 *
 * Ticket ids are generated here, by the system - the same way a real
 * backend would hand out its own opaque, unique ids rather than let a
 * caller pick them. Anything that wants a human-readable way to refer back
 * to a ticket has to keep its own record of which id that was - which is
 * exactly what `UseScenarioContext` is for.
 *
 * There's a single instance of this class, shared across every scenario -
 * `instance()` always returns the same one - the same way a real support
 * desk would keep its tickets (and its registered agents) in one backend,
 * not spin up a fresh one per test. Tickets raised in one scenario are
 * still there in the next, which is what makes referring to them by id,
 * rather than by position, actually matter - and why anything searching by
 * subject needs to be specific enough to tell its own tickets apart from
 * everyone else's, and every agent needs to register under its own,
 * unique username.
 */
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

        return { status: 404, body: { error: `No such endpoint: ${ path }` } };
    }

    /**
     * Registers a new agent account, the same way a real support desk would
     * require an agent to be provisioned before they can log in. Usernames
     * are taken on a first-come, first-served basis, same as any real sign-up.
     */
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

    /**
     * Exchanges a username and password for a session - only agents that
     * have already registered (via `/register`) are ever accepted, the same
     * way a real support desk would only let provisioned agents in.
     */
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

    /**
     * Every endpoint other than `/register` and `/login` needs a valid
     * session - a `Bearer` token from a prior login - the same way a real
     * support desk wouldn't let anyone touch a ticket before proving who
     * they are.
     */
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

    /**
     * A case-insensitive, "contains" search over every ticket's subject -
     * not an exact match - the same way a support agent would search a real
     * helpdesk: by whatever part of the subject they remember, not the
     * whole thing verbatim.
     *
     * `testId`, when given, narrows the search down further to tickets
     * whose subject also contains it. It's a second, independent "contains"
     * check rather than something folded into `subject`, so a caller can
     * search by any fragment of the subject - not just one that happens to
     * sit right next to the test id - and still only ever see tickets
     * raised by its own scenario, not ones left behind by every other
     * scenario sharing this same, singleton backend.
     */
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

    private found<Representation>(
        representation: Representation | undefined,
        errorMessage: string,
    ): HttpResponse<Representation | ErrorRepresentation> {
        return representation
            ? { status: 200, body: representation }
            : { status: 404, body: { error: errorMessage } };
    }
}
