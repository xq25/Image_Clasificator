import { DoctorArea } from './DoctorArea';

export interface EvaluationArea {
  id?: number;
  codeArea: string;
  name: string;
  doctorAreas?: DoctorArea[];
}
