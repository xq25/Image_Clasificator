import { User } from './User';

export class Session {
    id?: string;
    token?: string;
    expiration?: string;
    code2FA?: string;
    user?: User;
    active?:boolean
}