import { User } from "./User";
export interface RegisterRequest {
    user: User;
    defaultRoleId: String;
}