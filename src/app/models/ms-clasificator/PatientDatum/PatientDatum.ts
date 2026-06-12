import { ClinicalRecord } from "@models/ms-clasificator/ClinicalRecord/ClinicalRecord";
import { PrimitiveDatum } from "@models/ms-clasificator/PrimitiveDatum/PrimitiveDatum";


export interface PatientDatum {
  id?: number;
  description: string;
  primitiveDatumId?: number;
  clinicalRecordId?: number;
}
export interface PatientDatumExtended extends PatientDatum {
  clinicalRecord: ClinicalRecord;
  primitiveDatum: PrimitiveDatum;
}