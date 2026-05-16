import { ImageDiagnostic } from './ImageDiagnostic';

export interface MedicalImg {
  id?: number;
  url: string;
  evaluationAreaId: number;
  patientId?: number;
  imageDiagnostics?: ImageDiagnostic[];
}
