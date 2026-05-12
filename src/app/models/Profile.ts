import { User } from "./User";

export interface Profile {
  id: string;
  phone?: string;
  photo?: string;
  user?:User;
}