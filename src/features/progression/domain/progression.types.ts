export type ProgressionStatus = 'in_progress' | 'completed';

export interface ProgressionState {
  id: string;
  taskId: string;
  currentCursor: string;
  totalSteps: number;
  completedSteps: number;
  status: ProgressionStatus;
  startedAt: number;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface ProgressionEvent {
  id: string;
  progressionId: string;
  fromCursor: string;
  toCursor: string;
  action: 'advance' | 'regress' | 'skip' | 'complete';
  timestamp: number;
}
