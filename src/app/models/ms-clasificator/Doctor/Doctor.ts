import { User } from "@models/User";

export interface Doctor {
  id?: number;
  code: string;
  userId?: string;
}
export interface DoctorExtended extends Doctor {
  userInfo:User
}