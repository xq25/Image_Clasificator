import { User } from "@app/models/User";

export interface Patient {
  id?: number;
  document: string;
  dob: Date;
  sex: Sex;
  userId?: string; 
}
export enum Sex {
  MALE = 'Male',
  FEMALE = 'Female',
  INTERSEX = 'Intersex'
}

export interface PatientExtended extends Patient {
  userInfo: User
}
  