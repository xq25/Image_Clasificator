export interface ImageDiagnostic {
  id?: number;
  doctorId: number;
  medicalImgId: number;
  medicalDiagnosticId: number;
  diagnosticDate: Date | string;
}
