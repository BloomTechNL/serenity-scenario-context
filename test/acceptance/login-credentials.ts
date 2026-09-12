import { randomUUID } from 'node:crypto';

export class LoginCredentials {
    constructor(
        public readonly username: string,
        public readonly password: string,
    ) {
    }

    public static random(): LoginCredentials {
        return new LoginCredentials(`agent.${ randomUUID() }`, randomUUID());
    }
}
