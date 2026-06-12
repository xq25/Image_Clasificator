import { MedicalDiagnostic } from "@models/ms-clasificator/MedicalDiagnostic/MedicalDiagnostic";
import { ImageDiagnosticExtended } from "../ImageDiagnostic/ImageDiagnostic";

export interface ImageDoctorDiagnostics {
  id?: number;
  imageDiagnosticId: number;
  medicalDiagnostic: MedicalDiagnostic;
}
export interface ImageDoctorDiagnosticsExtended extends ImageDoctorDiagnostics {
  imageDiagnostic: ImageDiagnosticExtended;

}