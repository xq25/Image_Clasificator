import { EvaluationArea } from "@models/ms-clasificator/EvaluationArea/EvaluationArea";

export interface MedicalImageType {
  id?: number;
  name: string;
}
export interface MedicalImageTypeExtended extends MedicalImageType {
  evaluationArea: EvaluationArea;
}