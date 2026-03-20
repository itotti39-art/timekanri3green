import { useState } from 'react';
import { useStore } from '../store';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Download, FileText, ChevronLeft, ChevronRight, Clock, DollarSign } from 'lucide-react';
import type { TimeRecord, WorkSession, RestRecord } from '../types';

export const Monthly = () => {
  const users = useStore(state => state.users);
  const records = useStore(state => state.records);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const monthRecords = records.filter(r => isWithinInterval(new Date(r.date), { start: monthStart, end: monthEnd }));
  
  const displayRecords = selectedUserId === 'all' 
    ? monthRecords 
    : monthRecords.filter(r => r.user_id === selectedUserId);

  const calculateSessionMinutes = (session: WorkSession) => {
    if (!session.clock_in || !session.clock_out) return 0;
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    const startMins = toMinutes(session.clock_in);
    const endMins = toMinutes(session.clock_out);
    let restMins = 0;
    session.rests.forEach((r: RestRecord) => {
      if (r.start_time && r.end_time) {
        restMins += (toMinutes(r.end_time) - toMinutes(r.start_time));
      }
    });
    return Math.max(0, (endMins - startMins) - restMins);
  };

  const calculateHours = (record: TimeRecord) => {
    const totalMins = record.sessions.reduce((acc, s) => acc + calculateSessionMinutes(s), 0);
    return totalMins / 60;
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || '不明';
  const getUserRate = (id: string) => users.find(u => u.id === id)?.hourly_rate || 0;

  const handleExportCSV = () => {
    // CSVヘッダー
    const header = ['日付', '作業者名', '勤務詳細', '稼働時間', '概算給与', '状態'];
    const rows = displayRecords.map(r => {
      const hours = calculateHours(r);
      const rate = getUserRate(r.user_id);
      const cost = Math.floor(hours * rate);
      const sessionDetails = r.sessions
        .map(s => `${s.clock_in}-${s.clock_out || '未退勤'}`)
        .join(' / ');
      
      return [
        r.date,
        getUserName(r.user_id),
        `"${sessionDetails}"`,
        hours.toFixed(2),
        cost.toString(),
        r.state === 'finished' ? '完了' : '未完了'
      ];
    });

    const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // BOM付与でExcelの文字化け防止
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `timesheet_${format(currentDate, 'yyyy-MM')}.csv`;
    link.click();
  };

  // 表示用に日付でソート
  const sortedRecords = [...displayRecords].sort((a, b) => a.date.localeCompare(b.date));

  // 合計の計算
  const totalStats = displayRecords.reduce((acc, r) => {
    const hours = calculateHours(r);
    const cost = Math.floor(hours * getUserRate(r.user_id));
    return {
      hours: acc.hours + hours,
      cost: acc.cost + cost
    };
  }, { hours: 0, cost: 0 });

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <FileText className="w-6 h-6 text-gray-600" />
          月次詳細
        </h2>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-2 py-1">
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium min-w-24 text-center">
              {format(currentDate, 'yyyy年 MM月')}
            </span>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <select
            value={selectedUserId}
            onChange={e => setSelectedUserId(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="all">全員表示</option>
            {users.filter(u => u.role === 'worker').map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            CSV出力
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100 bg-white">
        <div className="p-4 text-center">
          <p className="text-xs font-medium text-gray-500 mb-1 flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            合計稼働時間
          </p>
          <p className="text-2xl font-bold text-gray-800 tracking-tight">
            {totalStats.hours.toFixed(1)} <span className="text-sm text-gray-500 font-normal">h</span>
          </p>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs font-medium text-gray-500 mb-1 flex items-center justify-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            合計概算給与
          </p>
          <p className="text-2xl font-bold text-green-600 tracking-tight">
            ¥{totalStats.cost.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm">
              <th className="p-4 font-medium border-b">日付</th>
              <th className="p-4 font-medium border-b">作業者</th>
              <th className="p-4 font-medium border-b text-center">勤務詳細 (出勤-退勤)</th>
              <th className="p-4 font-medium border-b">稼働時間</th>
              <th className="p-4 font-medium border-b">概算給与</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedRecords.map(r => {
              const hours = calculateHours(r);
              const cost = Math.floor(hours * getUserRate(r.user_id));
              return (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 text-gray-700">{r.date}</td>
                  <td className="p-4 font-medium">{getUserName(r.user_id)}</td>
                  <td className="p-4 text-center">
                    <div className="flex flex-wrap justify-center gap-2">
                      {r.sessions.map((s, idx) => (
                        <span key={idx} className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {s.clock_in}-{s.clock_out || '...'}
                        </span>
                      ))}
                      {r.sessions.length === 0 && <span className="text-gray-300">-</span>}
                    </div>
                  </td>
                  <td className="p-4 text-gray-800 font-medium">{hours.toFixed(1)} h</td>
                  <td className="p-4 text-green-600 font-medium">¥{cost.toLocaleString()}</td>
                </tr>
              );
            })}
            {sortedRecords.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  該当するデータがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
