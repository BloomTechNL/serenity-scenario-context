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

/**
 * A fake "support desk" system, exposed the same way a real one would be:
 * over an HTTP-like API of resources - tickets, for now - rather than as
 * plain objects the tests can reach into and mutate directly.
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
 * desk would keep its tickets in one backend, not spin up a fresh one per
 * test. Tickets raised in one scenario are still there in the next, which
 * is what makes referring to them by id, rather than by position, actually
 * matter.
 */
export class SupportDeskApi implements HttpApi {

    private static readonly shared = new SupportDeskApi();

    static instance(): SupportDeskApi {
        return SupportDeskApi.shared;
    }

    private readonly tickets = new Map<string, TicketRepresentation>();

    get<ResponseBody>(path: string): HttpResponse<ResponseBody | ErrorRepresentation> {
        return this.route(path) as HttpResponse<ResponseBody | ErrorRepresentation>;
    }

    post<ResponseBody>(path: string, body?: unknown): HttpResponse<ResponseBody | ErrorRepresentation> {
        return this.route(path, body) as HttpResponse<ResponseBody | ErrorRepresentation>;
    }

    private route(path: string, body?: unknown): HttpResponse<unknown> {
        const ticket = /^\/tickets\/([^/]+)$/.exec(path);
        if (ticket) {
            return this.found(this.tickets.get(decodeURIComponent(ticket[1])), `No ticket with id ${ ticket[1] }`);
        }

        if (path === '/tickets') {
            return this.createTicket(body as NewTicket);
        }

        const resolveTicket = /^\/tickets\/([^/]+)\/resolve$/.exec(path);
        if (resolveTicket) {
            return this.resolveTicket(decodeURIComponent(resolveTicket[1]));
        }

        return { status: 404, body: { error: `No such endpoint: ${ path }` } };
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
