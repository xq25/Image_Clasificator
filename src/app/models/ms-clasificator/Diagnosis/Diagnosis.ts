import { MedicalDiagnostic } from "@models/ms-clasificator/MedicalDiagnostic/MedicalDiagnostic";
import { ClinicalRecord } from "../ClinicalRecord/ClinicalRecord";

export interface Diagnosis {
    id?: number;
    medicalDiagnostic: MedicalDiagnostic;
}
export interface DiagnosisExtended extends Diagnosis {
    clinicalRecord: ClinicalRecord;
}