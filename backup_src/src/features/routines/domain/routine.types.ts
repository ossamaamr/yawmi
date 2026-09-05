export interface RoutineItem {
  id: string;
  routineId: string;
  title: string;
  sortOrder: number;
  isCompleted: boolean;
  createdAt: number;
}

export interface CreateRoutineItemInput {
  title: string;
  sortOrder?: number;
}
