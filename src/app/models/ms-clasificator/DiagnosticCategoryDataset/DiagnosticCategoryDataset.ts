import { DatasetCategory } from "@models/ms-clasificator/DatasetCategory/DatasetCategory";
import { MedicalDiagnostic } from "@models/ms-clasificator/MedicalDiagnostic/MedicalDiagnostic";

export interface DaignosticCategoryDataset {
    id?: number;
    medicalDiagnostic: MedicalDiagnostic;
}
export interface DaignosticCategoryDatasetExtended extends DaignosticCategoryDataset {
    datasetCategory: DatasetCategory;
}