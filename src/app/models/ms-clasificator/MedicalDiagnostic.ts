import { UIState } from './UIState';
import { UIConfig } from './UIConfig';
import { ImageDiagnostic } from './ImageDiagnostic';

export interface MedicalDiagnostic {
  id?: number;
  diagnosticCode: string;
  diagnosticName?: string;
  parentDiagnosticId?: number;
  parentDiagnostic?: MedicalDiagnostic;
  subDiagnostics?: MedicalDiagnostic[];
  uiStates?: UIState[];
  uiConfigs?: UIConfig[];
  imageDiagnostics?: ImageDiagnostic[];
}
