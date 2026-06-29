export interface SubTask {
  id: string;
  name: string;
  emoji: string;
}

export interface Task {
  id: string;
  time?: string;
  name: string;
  emoji: string;
  note?: string;
  isMission?: boolean;
  order?: number;
  subTasks?: SubTask[];
}

export interface Mission {
  icon: string;
  text: string;
}

export interface DayConfig {
  id: string;
  name: string;
  shortName: string;
  emoji: string;
  subtitle: string;
  color: string;
  lightColor: string;
  darkColor: string;
  mission: Mission;
  tasks: Task[];
}

// localStorage schema
export interface CompletionLog {
  [date: string]: {
    [dayId: string]: {
      [taskId: string]: boolean;
    };
  };
}

export interface MissionLog {
  [weekKey: string]: {
    [dayId: string]: boolean;
  };
}

// Dashboard stats
export interface DayStats {
  date: string;
  dayId: string;
  total: number;
  completed: number;
  percent: number;
}

export interface WeeklyMissionStat {
  dayId: string;
  dayName: string;
  shortName: string;
  color: string;
  missionText: string;
  completed: boolean;
}
