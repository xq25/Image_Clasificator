import { MedicalDiagnostic } from "@models/ms-clasificator/MedicalDiagnostic/MedicalDiagnostic";
import { MedicalImageType } from "@models/ms-clasificator/MedicalImageType/MedicalImageType";

export interface Dataset{
    id?: number;
    name: string;
    medicalDiagnostic: MedicalDiagnostic;
    medicalImageType: MedicalImageType;
}

export interface DatasetExtended extends Dataset {}