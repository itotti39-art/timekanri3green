-- ユーザーテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'worker')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 出退勤記録テーブル
CREATE TABLE time_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  state TEXT NOT NULL DEFAULT 'idle' CHECK (state IN ('idle', 'working', 'resting', 'finished')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 勤務セッションテーブル
CREATE TABLE work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES time_records(id) ON DELETE CASCADE,
  clock_in TIME NOT NULL,
  clock_out TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 休憩記録テーブル
CREATE TABLE rest_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初期データの挿入
INSERT INTO users (id, name, pin, hourly_rate, role) VALUES
  ('00000000-0000-0000-0000-000000000001', '田中太郎', '1234', 1500, 'worker'),
  ('00000000-0000-0000-0000-000000000002', '佐藤花子', '5678', 1800, 'admin');

-- Row Level Security (RLS) の設定 (簡易版: 開発・運用初期用)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rest_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for testing" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert for testing" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for testing" ON users FOR UPDATE USING (true);

CREATE POLICY "Allow public all for time_records" ON time_records FOR ALL USING (true);
CREATE POLICY "Allow public all for work_sessions" ON work_sessions FOR ALL USING (true);
CREATE POLICY "Allow public all for rest_records" ON rest_records FOR ALL USING (true);
