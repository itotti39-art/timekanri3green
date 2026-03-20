export type User = {
  id: string; // UUID from Supabase
  name: string;
  pin: string;
  hourly_rate: number;
  role: 'admin' | 'worker';
};

export type ShiftState = 'idle' | 'working' | 'resting' | 'finished';

export type RestRecord = {
  id: string; // UUID
  session_id: string; // FK
  start_time: string; // HH:mm
  end_time: string | null; // HH:mm
};

export type WorkSession = {
  id: string; // UUID
  record_id: string; // FK
  clock_in: string; // HH:mm
  clock_out: string | null; // HH:mm
  rests: RestRecord[];
};

export type TimeRecord = {
  id: string; // UUID
  user_id: string;
  date: string; // YYYY-MM-DD
  sessions: WorkSession[];
  state: ShiftState;
};

export type AppState = {
  users: User[];
  records: TimeRecord[];
  currentUser: User | null;
  fetchInitialData: () => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  
  clockIn: (user_id: string) => Promise<void>;
  clockOut: (user_id: string) => Promise<void>;
  startRest: (user_id: string) => Promise<void>;
  endRest: (user_id: string) => Promise<void>;
  
  updateRecord: (recordId: string, updates: Partial<TimeRecord>) => Promise<void>;
  addRecord: (record: TimeRecord) => Promise<void>;
};
