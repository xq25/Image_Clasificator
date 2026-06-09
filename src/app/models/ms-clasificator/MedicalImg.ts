export interface MedicalImg {
  id?: number;
  imageKey: string;
  imageUrl: string;
  provider: string;
  contentType?: string;
  fileSize?: number;
  medicalImageTypeId: number;
  clinicalRecordId?: number;
  createdAt?: Date | string;
}