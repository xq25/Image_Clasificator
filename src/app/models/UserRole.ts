import { Role } from "./Role";
import { User } from "./User";

export interface UserRole {
  id: string;
  user: User;
  role: Role;
}