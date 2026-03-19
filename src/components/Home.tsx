import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Play, Square, Coffee, Clock, DollarSign } from 'lucide-react';
import type { TimeRecord, WorkSession } from '../types';

export const Home = () => {
  const currentUser = useStore(state => state.currentUser);
  const records = useStore(state => state.records);
  const clockIn = useStore(state => state.clockIn);
  const clockOut = useStore(state => state.clockOut);
  const startRest = useStore(state => state.startRest);
  const endRest = useStore(state => state.endRest);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentUser) return null;

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayRecord = records.find(r => r.userId === currentUser.id && r.date === today);

  const currentState = todayRecord?.state || 'idle';

  // --- 個人の今月のサマリー計算 ---
  const todayDate = new Date();
  const monthStart = startOfMonth(todayDate);
  const monthEnd = endOfMonth(todayDate);
  
  const thisMonthRecords = records.filter(r => 
    r.userId === currentUser.id &&
    isWithinInterval(new Date(r.date), { start: monthStart, end: monthEnd })
  );

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

  const totalMinutes = thisMonthRecords.reduce((acc, r: TimeRecord) => 
    acc + r.sessions.reduce((sum, s) => sum + calculateSessionMinutes(s), 0), 0
  );
  const totalHours = totalMinutes / 60;
  const estimatedCost = totalHours * currentUser.hourlyRate;
  // ------------------------------

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 text-center">
        <h2 className="text-xl font-medium text-gray-500 mb-2">現在時刻</h2>
        <div className="text-5xl font-mono font-bold text-gray-800 tracking-wider">
          {format(currentTime, 'HH:mm:ss')}
        </div>
        <div className="text-gray-500 mt-2">{format(todayDate, 'yyyy年MM月dd日')}</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => clockIn(currentUser.id)}
          disabled={currentState !== 'idle' && currentState !== 'finished'}
          className={`p-6 rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-200 ${
            currentState === 'idle' || currentState === 'finished'
              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 shadow-sm'
              : 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed'
          }`}
        >
          <Play className="w-10 h-10" />
          <span className="font-bold text-lg">{currentState === 'finished' ? '再出勤' : '出勤'}</span>
        </button>

        <button
          onClick={() => clockOut(currentUser.id)}
          disabled={currentState !== 'working' && currentState !== 'resting'}
          className={`p-6 rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-200 ${
            currentState === 'working' || currentState === 'resting'
              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-sm'
              : 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed'
          }`}
        >
          <Square className="w-10 h-10" />
          <span className="font-bold text-lg">退勤</span>
        </button>

        <button
          onClick={() => currentState === 'working' ? startRest(currentUser.id) : endRest(currentUser.id)}
          disabled={currentState !== 'working' && currentState !== 'resting'}
          className={`col-span-2 p-6 rounded-xl flex items-center justify-center gap-4 transition-all duration-200 ${
            currentState === 'working'
              ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 shadow-sm'
              : currentState === 'resting'
              ? 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 shadow-sm'
              : 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed'
          }`}
        >
          {currentState === 'resting' ? (
            <>
              <Play className="w-8 h-8" />
              <span className="font-bold text-lg">休憩終了 (業務再開)</span>
            </>
          ) : (
            <>
              <Coffee className="w-8 h-8" />
              <span className="font-bold text-lg">休憩開始</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">今月の稼働</p>
            <p className="text-xl font-bold text-gray-800">{totalHours.toFixed(1)} h</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">今月の給与</p>
            <p className="text-xl font-bold text-gray-800">¥{Math.floor(estimatedCost).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {todayRecord && todayRecord.sessions.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            本日の稼働状況
          </h3>
          <div className="space-y-6">
            {todayRecord.sessions.map((session, sIdx) => (
              <div key={sIdx} className="space-y-2 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="flex justify-between items-center font-medium text-gray-600 text-sm mb-1">
                  <span>勤務セッション {sIdx + 1}</span>
                  {session.clock_in && session.clock_out && (
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                      {(calculateSessionMinutes(session) / 60).toFixed(1)} h
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500">出勤</span>
                  <span className="font-medium font-mono text-lg">{session.clock_in}</span>
                </div>
                {session.rests.map((rest, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 text-orange-600 text-sm">
                    <span>休憩 {idx + 1}</span>
                    <span className="font-medium font-mono">
                      {rest.start_time} - {rest.end_time || '休憩中'}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500">退勤</span>
                  <span className="font-medium font-mono text-lg">{session.clock_out || '--:--'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
