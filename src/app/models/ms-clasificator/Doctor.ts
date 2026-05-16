import { DoctorArea } from './DoctorArea';
import { ImageDiagnostic } from './ImageDiagnostic';

export interface Doctor {
  id?: number;
  code: string;
  userId: string;
  doctorAreas?: DoctorArea[];
  imageDiagnostics?: ImageDiagnostic[];
}
