import { MedicalImageType } from "@models/ms-clasificator/MedicalImageType/MedicalImageType";
import { ClinicalRecord } from "@models/ms-clasificator/ClinicalRecord/ClinicalRecord";

export interface MedicalImg {
  id?: number;
  imageKey: string;
  imageUrl?: string;
  provider: string;
  contentType?: string;
  medicalImageTypeName?: string;
  fileSize?: number;
  createdAt?: Date | string;
}
export interface MedicalImgExtended extends MedicalImg {
  medicalImageType: MedicalImageType;
  clinicalRecord?:  ClinicalRecord;
}