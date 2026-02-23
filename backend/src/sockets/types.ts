import { Socket } from 'socket.io';
import { TokenPayload } from '../lib/auth.js';

export interface AuthenticatedSocket extends Socket {
    user: TokenPayload;
}
