export class TicketContext {
    constructor(
        public readonly id: string,
        public readonly subject: string,
    ) {
    }

    changeSubject(newSubject: string): TicketContext {
        return new TicketContext(this.id, newSubject);
    }

}