import { TokenPayload } from './lib/auth.js';

export type Env = {
    Variables: {
        user: TokenPayload;
    };
};
