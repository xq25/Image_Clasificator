import { UIState } from './UIState';

export interface UIConfig {
  id?: number;
  medicalDiagnosticId: number;
  uiStates?: UIState[];
}
