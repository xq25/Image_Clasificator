export interface Permission {
  id: string;
  url: string;
  method?: string;
  model?:string;
}

export enum HttpMethod {
  GET    = 'GET',
  POST   = 'POST',
  PUT    = 'PUT',
  DELETE = 'DELETE'
}
 
export enum PermissionModel {
  ROLE       = 'Role',
  USER       = 'User',
  PERMISSION = 'Permission',
  PROFILE    = 'Profile',
  ROLE_PERMISSION = 'RolePermission',
  USER_ROLE   = 'UserRole',
  PHOTOS = 'Photo',

  DOCTOR = 'Doctor',
  PATIENT = 'Patient',
  MEDICAL_DIAGNOSTIC = 'MedicalDiagnostic',
  MEDICAL_IMAGE = 'MedicalImage',
  EVALUATION_AREA = 'EvaluationArea',
  DOCTOR_AREA = 'DoctorArea',
  IMAGE_DIAGNOSTIC = 'ImageDiagnostic',
  DATASET = 'DataSet',
  DATASET_CATEGORY = 'DataSetCategory',
  DIAGNOSTIC_CATEGORY_DATASET = 'DiagnosticCategoryDataSet',
  DIAGNOSIS = 'Diagnosis',
  IMAGE_DOCTOR_DIAGNOSTICS = 'ImageDoctorDiagnostics',
  CLINICAL_RECORD = 'ClinicalRecord',
  MEDICAL_IMAGE_TYPE = 'MedicalImageType',
  PATIENT_DATUM = 'PatientDatum',
  PRIMITIVE_DATUM = 'PrimitiveDatum',

}