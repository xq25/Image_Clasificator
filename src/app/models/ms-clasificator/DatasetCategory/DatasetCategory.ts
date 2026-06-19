import { Dataset } from "@models/ms-clasificator/Dataset/Dataset";

export interface DatasetCategory{
    id?: number;
    numValue: number;
    name: string;
}
export interface DatasetCategoryExtended extends DatasetCategory {
    dataset: Dataset;
}