export type User = {
  id: string; // UUID from Supabase
  name: string;
  pin: string;
  hourlyRate: number;
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
  userId: string;
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
  
  clockIn: (userId: string) => Promise<void>;
  clockOut: (userId: string) => Promise<void>;
  startRest: (userId: string) => Promise<void>;
  endRest: (userId: string) => Promise<void>;
  
  updateRecord: (recordId: string, updates: Partial<TimeRecord>) => Promise<void>;
  addRecord: (record: TimeRecord) => Promise<void>;
};
