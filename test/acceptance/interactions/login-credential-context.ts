import { randomUUID } from 'node:crypto';

export class LoginCredentialContext {
    constructor(
        public readonly username: string,
        public readonly password: string,
    ) {
    }

    public static random(): LoginCredentialContext {
        return new LoginCredentialContext(`agent.${ randomUUID() }`, randomUUID());
    }
}
