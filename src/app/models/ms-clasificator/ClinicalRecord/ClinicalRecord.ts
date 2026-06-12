import { Patient } from "@models/ms-clasificator/Patient/Patient";

export interface ClinicalRecord {
  id?: number;
  dateVisited: Date;
}

export interface ClinicalRecordExtended extends ClinicalRecord {
    patientInfo: Patient;
}