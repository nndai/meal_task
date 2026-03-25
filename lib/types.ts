export type Member = {
  id: number;
  name: string;
  colorClass: string;
};

export type TaskTemplate = {
  id: string;
  title: string;
};

export type TaskCompletion = {
  taskId: string;
  memberId: number;
  date: string;
};

export type TaskForDate = {
  id: string;
  title: string;
  date: string;
  completedBy: number[];
};

export type BoardState = {
  members: Member[];
  taskTemplates: TaskTemplate[];
  completions: TaskCompletion[];
};
