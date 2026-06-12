import { Doctor } from '@app/models/ms-clasificator/Doctor/Doctor';
import { EvaluationArea } from '@models/ms-clasificator/EvaluationArea/EvaluationArea';

export interface DoctorArea {
  id?: number;
  doctorId?: number;
  evaluationAreaId?: number;
}
export interface DoctorAreaExtended extends DoctorArea {
  doctor: Doctor;
  evaluationArea: EvaluationArea;
}