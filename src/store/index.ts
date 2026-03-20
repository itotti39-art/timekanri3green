import { create } from 'zustand';
import { format } from 'date-fns';
import type { AppState, User, TimeRecord } from '../types';
import { supabase } from '../lib/supabase';

export const useStore = create<AppState>((set, get) => ({
  users: [],
  records: [],
  currentUser: null,

  fetchInitialData: async () => {
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('name');
    
    if (usersError) console.error('Error fetching users:', usersError);
    if (usersData) set({ users: usersData as User[] });

    const { data: recordsData, error: recordsError } = await supabase
      .from('time_records')
      .select(`
        *,
        sessions:work_sessions (
          *,
          rests:rest_records (*)
        )
      `)
      .order('date', { ascending: false });

    if (recordsError) console.error('Error fetching records:', recordsError);
    if (recordsData) set({ records: recordsData as unknown as TimeRecord[] });
  },

  addUser: async (user) => {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding user:', error);
      return;
    }
    if (data) set((state) => ({ users: [...state.users, data as User] }));
  },

  updateUser: async (id, updates) => {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating user:', error);
      return;
    }
    set((state) => ({
      users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
    }));
  },

  deleteUser: async (id) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting user:', error);
      return;
    }
    set((state) => ({
      users: state.users.filter(u => u.id !== id)
    }));
  },

  setCurrentUser: (user) => set({ currentUser: user }),

  clockIn: async (user_id) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const now = format(new Date(), 'HH:mm');

    // 1. レコードの取得または作成
    let record = get().records.find(r => r.user_id === user_id && r.date === today);
    if (!record) {
      const { data, error } = await supabase
        .from('time_records')
        .insert([{ user_id: user_id, date: today, state: 'working' }])
        .select()
        .single();
      if (error) {
        console.error('Error creating record:', error);
        return;
      }
      record = { ...data, sessions: [] } as unknown as TimeRecord;
    } else {
      const { error } = await supabase
        .from('time_records')
        .update({ state: 'working' })
        .eq('id', record.id);
      if (error) {
        console.error('Error updating record state:', error);
        return;
      }
    }

    // 2. セッションの作成
    const { error: sessionError } = await supabase
      .from('work_sessions')
      .insert([{ record_id: record.id, clock_in: now }]);
    
    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return;
    }

    // ストアの更新
    get().fetchInitialData();
  },

  startRest: async (user_id) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const now = format(new Date(), 'HH:mm');
    const record = get().records.find(r => r.user_id === user_id && r.date === today && r.state === 'working');
    
    if (!record) return;

    const { error: recordError } = await supabase
      .from('time_records')
      .update({ state: 'resting' })
      .eq('id', record.id);

    if (recordError) {
      console.error('Error starting rest:', recordError);
      return;
    }

    const lastSession = record.sessions[record.sessions.length - 1];
    if (lastSession) {
      const { error: restError } = await supabase
        .from('rest_records')
        .insert([{ session_id: lastSession.id, start_time: now }]);
      if (restError) console.error('Error creating rest record:', restError);
    }

    get().fetchInitialData();
  },

  endRest: async (user_id) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const now = format(new Date(), 'HH:mm');
    const record = get().records.find(r => r.user_id === user_id && r.date === today && r.state === 'resting');
    
    if (!record) return;

    const { error: recordError } = await supabase
      .from('time_records')
      .update({ state: 'working' })
      .eq('id', record.id);

    if (recordError) {
      console.error('Error ending rest:', recordError);
      return;
    }

    const lastSession = record.sessions[record.sessions.length - 1];
    if (lastSession) {
      const lastRest = lastSession.rests[lastSession.rests.length - 1];
      if (lastRest) {
        const { error: restError } = await supabase
          .from('rest_records')
          .update({ end_time: now })
          .eq('id', lastRest.id);
        if (restError) console.error('Error updating rest record:', restError);
      }
    }

    get().fetchInitialData();
  },

  clockOut: async (user_id) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const now = format(new Date(), 'HH:mm');
    const record = get().records.find(r => r.user_id === user_id && r.date === today && (r.state === 'working' || r.state === 'resting'));
    
    if (!record) return;

    const { error: recordError } = await supabase
      .from('time_records')
      .update({ state: 'finished' })
      .eq('id', record.id);

    if (recordError) {
      console.error('Error clocking out:', recordError);
      return;
    }

    const lastSession = record.sessions[record.sessions.length - 1];
    if (lastSession) {
      // 休憩中の場合は休憩も終了させる
      if (record.state === 'resting') {
        const lastRest = lastSession.rests[lastSession.rests.length - 1];
        if (lastRest && !lastRest.end_time) {
          await supabase
            .from('rest_records')
            .update({ end_time: now })
            .eq('id', lastRest.id);
        }
      }
      const { error: sessionError } = await supabase
        .from('work_sessions')
        .update({ clock_out: now })
        .eq('id', lastSession.id);
      if (sessionError) console.error('Error updating session clock_out:', sessionError);
    }

    get().fetchInitialData();
  },

  updateRecord: async (recordId, updates) => {
    const { sessions, ...recordUpdates } = updates;
    
    if (Object.keys(recordUpdates).length > 0) {
      const { error } = await supabase
        .from('time_records')
        .update(recordUpdates)
        .eq('id', recordId);
      if (error) console.error('Error updating record:', error);
    }

    if (sessions !== undefined) {
      // Delete existing sessions (rest_records will cascade delete)
      await supabase.from('work_sessions').delete().eq('record_id', recordId);

      // Insert new sessions
      for (const session of sessions) {
        const { id, record_id, rests, ...sessionData } = session;
        const { data: newSession, error: sErr } = await supabase
          .from('work_sessions')
          .insert([{ ...sessionData, record_id: recordId }])
          .select()
          .single();
        
        if (sErr || !newSession) {
          console.error('Error inserting session:', sErr);
          continue;
        }

        if (rests && rests.length > 0) {
          const restsToInsert = rests.map(r => {
            const { id: rId, session_id, ...restData } = r;
            return { ...restData, session_id: newSession.id };
          });
          const { error: rErr } = await supabase.from('rest_records').insert(restsToInsert);
          if (rErr) console.error('Error inserting rests:', rErr);
        }
      }
    }

    get().fetchInitialData();
  },

  addRecord: async (record) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, sessions, ...recordData } = record;
    
    const { data: newRecord, error } = await supabase
      .from('time_records')
      .insert([recordData])
      .select()
      .single();
      
    if (error || !newRecord) {
      console.error('Error adding record:', error);
      return;
    }

    if (sessions && sessions.length > 0) {
      for (const session of sessions) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: sId, record_id, rests, ...sessionData } = session;
        const { data: newSession, error: sErr } = await supabase
          .from('work_sessions')
          .insert([{ ...sessionData, record_id: newRecord.id }])
          .select()
          .single();
        
        if (sErr || !newSession) {
          console.error('Error inserting session in addRecord:', sErr);
          continue;
        }

        if (rests && rests.length > 0) {
          const restsToInsert = rests.map(r => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id: rId, session_id, ...restData } = r;
            return { ...restData, session_id: newSession.id };
          });
          const { error: rErr } = await supabase.from('rest_records').insert(restsToInsert);
          if (rErr) console.error('Error inserting rests in addRecord:', rErr);
        }
      }
    }
    get().fetchInitialData();
  },
}));
