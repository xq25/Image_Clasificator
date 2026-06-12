
import { ImageDiagnostic } from '../ImageDiagnostic/ImageDiagnostic';

export interface MedicalDiagnostic {
  id?: number;
  diagnosticCode: string;
  diagnosticName: string;
}

export interface MedicalDiagnosticExtended extends MedicalDiagnostic {
  parentDiagnostic?: MedicalDiagnostic;
}