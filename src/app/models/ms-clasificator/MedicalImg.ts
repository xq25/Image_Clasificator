export interface MedicalImg {
  id?: number;
  imageKey: string;
  imageUrl: string;
  provider: string;
  contentType?: string;
  fileSize?: number;
  evaluationAreaId: number;
  patientId?: number;
  createdAt?: Date | string;
}
