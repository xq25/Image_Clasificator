import { User } from "@app/models/User";

export interface Patient {
  id?: number;
  document: string;
  years: number;
  userId?: string; 
}
export interface PatientExtended extends Patient {
  userInfo: User
}
  