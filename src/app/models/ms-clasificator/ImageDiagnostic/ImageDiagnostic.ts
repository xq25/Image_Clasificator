import { MedicalImg } from "@models/ms-clasificator/MedicalImage/MedicalImg";
import { Doctor } from "@app/models/ms-clasificator/Doctor/Doctor";

export interface ImageDiagnostic {
  id?: number;
  doctorId?: number;
  medicalImgId?: number;
  diagnosticDate: Date | string;
}
export interface ImageDiagnosticExtended extends ImageDiagnostic {
  doctor: Doctor;
  medicalImg: MedicalImg;
}