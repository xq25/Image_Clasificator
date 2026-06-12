import { MedicalDiagnostic } from "@models/ms-clasificator/MedicalDiagnostic/MedicalDiagnostic";
import { EvaluationArea } from "@models/ms-clasificator/EvaluationArea/EvaluationArea";

export interface Dataset{
    id?: number;
    name: string;
    medicalDiagnostic: MedicalDiagnostic;
}

export interface DatasetExtended extends Dataset {
    evaluationArea?: EvaluationArea;
}