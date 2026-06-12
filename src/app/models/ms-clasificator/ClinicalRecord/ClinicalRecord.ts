import { Patient } from "@models/ms-clasificator/Patient/Patient";

export interface ClinicalRecord {
  id?: number;
  chiefComplaint: string;
  visitDate: Date;
}

export interface ClinicalRecordExtended extends ClinicalRecord {
    patientInfo: Patient;
}