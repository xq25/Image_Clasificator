import { Doctor } from './Doctor';
import { EvaluationArea } from './EvaluationArea';

export interface DoctorArea {
  id?: number;
  doctor: Doctor;
  evaluationArea: EvaluationArea;
}
