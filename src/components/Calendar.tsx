import { useState } from 'react';
import { useStore } from '../store';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Edit2, Check, X, DollarSign, Plus, Trash2 } from 'lucide-react';
import type { TimeRecord, WorkSession } from '../types';

export const CalendarView = () => {
  const currentUser = useStore(state => state.currentUser);
  const records = useStore(state => state.records);
  const updateRecord = useStore(state => state.updateRecord);
  const addRecord = useStore(state => state.addRecord);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingDay, setEditingDay] = useState<string | null>(null);

  if (!currentUser) return null;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const userRecords = records.filter(r => r.user_id === currentUser.id);

  const getRecordForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return userRecords.find(r => r.date === dateStr);
  };

  const calculateSessionMinutes = (session: WorkSession) => {
    if (!session.clock_in || !session.clock_out) return 0;
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    const startMins = toMinutes(session.clock_in);
    const endMins = toMinutes(session.clock_out);
    let restMins = 0;
    session.rests.forEach(r => {
      if (r.start_time && r.end_time) {
        restMins += (toMinutes(r.end_time) - toMinutes(r.start_time));
      }
    });
    return Math.max(0, (endMins - startMins) - restMins);
  };

  const calculateHours = (record: TimeRecord | undefined) => {
    if (!record || record.sessions.length === 0) return '0.0';
    const totalMins = record.sessions.reduce((acc, s) => acc + calculateSessionMinutes(s), 0);
    return (totalMins / 60).toFixed(1);
  };

  const [editSessions, setEditSessions] = useState<WorkSession[]>([]);

  const handleEditClick = (day: Date, record?: TimeRecord) => {
    setEditingDay(day.toISOString());
    setEditSessions(record?.sessions ? JSON.parse(JSON.stringify(record.sessions)) : []);
  };

  const handleSaveEdit = (dayStr: string, record?: TimeRecord) => {
    // 空でないセッションのみ残す
    const cleanedSessions = editSessions.filter(s => s.clock_in || s.clock_out);

    if (record) {
      updateRecord(record.id, {
        sessions: cleanedSessions,
        state: cleanedSessions.some(s => s.clock_in && !s.clock_out) ? 'working' : 'finished'
      });
    } else {
      if (cleanedSessions.length > 0) {
        addRecord({
          id: String(Date.now()),
          user_id: currentUser.id,
          date: format(new Date(dayStr), 'yyyy-MM-dd'),
          sessions: cleanedSessions,
          state: cleanedSessions.some(s => s.clock_in && !s.clock_out) ? 'working' : 'finished'
        });
      }
    }
    setEditingDay(null);
  };

  const monthRecords = userRecords.filter(r => 
    isWithinInterval(new Date(r.date), { start: monthStart, end: monthEnd })
  );

  const totalMinutes = monthRecords.reduce((acc, r) => 
    acc + r.sessions.reduce((sum, s) => sum + calculateSessionMinutes(s), 0), 0
  );
  const totalHours = totalMinutes / 60;
  const estimatedCost = totalHours * currentUser.hourly_rate;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      <div className="p-4 bg-green-50 border-b border-green-100 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2 text-green-800">
          <CalendarIcon className="w-6 h-6" />
          稼働履歴
        </h2>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            className="p-1 hover:bg-green-200 rounded-full transition"
          >
            <ChevronLeft className="w-5 h-5 text-green-700" />
          </button>
          <span className="font-medium text-lg text-green-900 min-w-28 text-center">
            {format(currentDate, 'yyyy年 MM月')}
          </span>
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            className="p-1 hover:bg-green-200 rounded-full transition"
          >
            <ChevronRight className="w-5 h-5 text-green-700" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100 bg-white">
        <div className="p-4 text-center">
          <p className="text-xs font-medium text-gray-500 mb-1 flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            表示月の稼働時間
          </p>
          <p className="text-2xl font-bold text-gray-800 tracking-tight">
            {totalHours.toFixed(1)} <span className="text-sm text-gray-500 font-normal">h</span>
          </p>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs font-medium text-gray-500 mb-1 flex items-center justify-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            表示月の概算給与
          </p>
          <p className="text-2xl font-bold text-green-600 tracking-tight">
            ¥{Math.floor(estimatedCost).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm">
              <th className="p-4 font-medium border-b w-32"></th>
              <th className="p-4 font-medium border-b">出勤</th>
              <th className="p-4 font-medium border-b">退勤</th>
              <th className="p-4 font-medium border-b">休憩</th>
              <th className="p-4 font-medium border-b">稼働時間</th>
              <th className="p-4 font-medium border-b w-24 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {days.map(day => {
              const record = getRecordForDay(day);
              const isToday = isSameDay(day, new Date());
              const isEditing = editingDay === day.toISOString();

              return (
                <tr key={day.toISOString()} className={`hover:bg-gray-50 transition ${isToday ? 'bg-blue-50/50' : ''}`}>
                  <td className="p-4 align-top border-b border-gray-50">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-medium ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                        {format(day, 'd')}日
                      </span>
                      <span className="text-sm text-gray-400">
                        ({['日', '月', '火', '水', '木', '金', '土'][day.getDay()]})
                      </span>
                    </div>
                  </td>
                  {isEditing ? (
                    <td colSpan={4} className="p-4 border-b border-gray-50">
                      <div className="space-y-4">
                        {editSessions.map((session, sIdx) => (
                          <div key={sIdx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-500">勤務 {sIdx + 1}</span>
                              <button 
                                onClick={() => setEditSessions(editSessions.filter((_, i) => i !== sIdx))}
                                className="text-red-500 hover:text-red-700 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <input 
                                type="time" 
                                value={session.clock_in} 
                                onChange={(e) => {
                                  const newSessions = [...editSessions];
                                  newSessions[sIdx].clock_in = e.target.value;
                                  setEditSessions(newSessions);
                                }}
                                className="border border-gray-300 rounded p-1 text-sm bg-white"
                              />
                              <span className="text-gray-400">-</span>
                              <input 
                                type="time" 
                                value={session.clock_out || ''} 
                                onChange={(e) => {
                                  const newSessions = [...editSessions];
                                  newSessions[sIdx].clock_out = e.target.value || null;
                                  setEditSessions(newSessions);
                                }}
                                className="border border-gray-300 rounded p-1 text-sm bg-white"
                              />
                            </div>
                            <div className="space-y-1.5 pl-4 border-l-2 border-orange-100">
                              {session.rests.map((rest, rIdx) => (
                                <div key={rIdx} className="flex items-center gap-2">
                                  <span className="text-[10px] text-orange-400 font-bold uppercase w-8">休憩</span>
                                  <input 
                                    type="time" 
                                    value={rest.start_time} 
                                    onChange={(e) => {
                                      const newSessions = [...editSessions];
                                      newSessions[sIdx].rests[rIdx].start_time = e.target.value;
                                      setEditSessions(newSessions);
                                    }}
                                    className="border border-gray-200 rounded p-0.5 text-xs bg-white w-20"
                                  />
                                  <span className="text-xs text-gray-400">-</span>
                                  <input 
                                    type="time" 
                                    value={rest.end_time || ''} 
                                    onChange={(e) => {
                                      const newSessions = [...editSessions];
                                      newSessions[sIdx].rests[rIdx].end_time = e.target.value || null;
                                      setEditSessions(newSessions);
                                    }}
                                    className="border border-gray-200 rounded p-0.5 text-xs bg-white w-20"
                                  />
                                  <button 
                                    onClick={() => {
                                      const newSessions = [...editSessions];
                                      newSessions[sIdx].rests = newSessions[sIdx].rests.filter((_, i) => i !== rIdx);
                                      setEditSessions(newSessions);
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              <button 
                                onClick={() => {
                                  const newSessions = [...editSessions];
                                  newSessions[sIdx].rests.push({ id: String(Date.now()), session_id: session.id, start_time: '', end_time: null });
                                  setEditSessions(newSessions);
                                }}
                                className="text-[10px] text-orange-600 hover:text-orange-800 font-bold flex items-center bg-orange-50 px-1.5 py-0.5 rounded transition"
                              >
                                <Plus className="w-3 h-3 mr-0.5" /> 休憩追加
                              </button>
                            </div>
                          </div>
                        ))}
                        <button 
                          onClick={() => setEditSessions([...editSessions, { id: String(Date.now()), record_id: record?.id || '', clock_in: '', clock_out: null, rests: [] }])}
                          className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 transition flex items-center justify-center gap-1"
                        >
                          <Plus className="w-4 h-4" /> 勤務セッションを追加
                        </button>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="p-4 align-top text-gray-700 border-b border-gray-50">
                        {record?.sessions.length ? record.sessions.map((s, idx) => (
                          <div key={idx} className="min-h-[24px]">{s.clock_in || '-'}</div>
                        )) : '-'}
                      </td>
                      <td className="p-4 align-top text-gray-700 border-b border-gray-50">
                        {record?.sessions.length ? record.sessions.map((s, idx) => (
                          <div key={idx} className="min-h-[24px]">{s.clock_out || '-'}</div>
                        )) : '-'}
                      </td>
                      <td className="p-4 align-top text-gray-700 text-sm border-b border-gray-50">
                        {record?.sessions.length ? record.sessions.map((s, idx) => (
                          <div key={idx} className="min-h-[24px]">
                            {s.rests.length > 0 
                              ? s.rests.map((r, ri) => <span key={ri} className="mr-2">{r.start_time}-{r.end_time || ''}</span>) 
                              : '-'}
                          </div>
                        )) : '-'}
                      </td>
                      <td className="p-4 align-top text-gray-700 border-b border-gray-50">
                        {record?.sessions.length ? (
                          <span className="font-medium text-gray-900">{calculateHours(record)}</span>
                        ) : '-'}
                      </td>
                    </>
                  )}
                  <td className="p-4 text-center align-top border-b border-gray-50">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => handleSaveEdit(day.toISOString(), record)}
                          className="w-full text-white bg-green-600 hover:bg-green-700 p-1.5 rounded transition flex items-center justify-center" 
                          title="保存"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setEditingDay(null)}
                          className="w-full text-gray-500 bg-gray-200 hover:bg-gray-300 p-1.5 rounded transition flex items-center justify-center" 
                          title="キャンセル"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleEditClick(day, record)}
                        className="text-gray-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-blue-50 transition"
                        title="編集"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
