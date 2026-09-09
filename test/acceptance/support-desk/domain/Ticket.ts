export type TicketStatus = 'open' | 'resolved';
export type TicketPriority = 'normal' | 'urgent';

/**
 * A fake domain object used to demonstrate the scenario context ability.
 * Imagine a support agent working through a queue of customer tickets,
 * switching their attention between several of them within a single
 * scenario.
 */
export class Ticket {

    public status: TicketStatus = 'open';

    constructor(
        public readonly id: string,
        public readonly subject: string,
        public readonly priority: TicketPriority = 'normal',
    ) {
    }
}
