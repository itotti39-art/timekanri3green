import { useStore } from '../store';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Users, Clock, DollarSign, TrendingUp } from 'lucide-react';
import type { TimeRecord, WorkSession } from '../types';

export const Dashboard = () => {
  const users = useStore(state => state.users);
  const records = useStore(state => state.records);
  const currentDate = new Date();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // 今月の全レコード
  const thisMonthRecords = records.filter(r => {
    return isWithinInterval(new Date(r.date), { start: monthStart, end: monthEnd });
  });

  const workerUsers = users.filter(u => u.role === 'worker');

  // KPI計算用のヘルパー
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

  const calculateRecordMinutes = (record: TimeRecord) => {
    return record.sessions.reduce((acc, s) => acc + calculateSessionMinutes(s), 0);
  };

  // 全体のサマリー
  let totalHours = 0;
  let totalCost = 0;
  
  const workerStats = workerUsers.map(worker => {
    const workerRecords = thisMonthRecords.filter(r => r.userId === worker.id);
    const minutes = workerRecords.reduce((acc, r) => acc + calculateRecordMinutes(r), 0);
    const hours = minutes / 60;
    const cost = hours * worker.hourlyRate;
    
    totalHours += hours;
    totalCost += cost;
    
    return {
      worker,
      hours,
      cost,
      shifts: workerRecords.length
    };
  });

  // 時間順にソート（ランキング）
  workerStats.sort((a, b) => b.hours - a.hours);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">全体ダッシュボード</h2>
        <span className="font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm">
          {format(currentDate, 'yyyy年 MM月')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-full">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">アクティブ作業者</p>
            <p className="text-3xl font-bold text-gray-900">{workerUsers.length} <span className="text-lg text-gray-500 font-normal">人</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-purple-100 p-4 rounded-full">
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">総稼働時間</p>
            <p className="text-3xl font-bold text-gray-900">{totalHours.toFixed(1)} <span className="text-lg text-gray-500 font-normal">h</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-green-100 p-4 rounded-full">
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">想定人件費</p>
            <p className="text-3xl font-bold text-gray-900">¥{Math.floor(totalCost).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gray-500" />
          <h3 className="font-bold text-gray-800 text-lg">稼働ランキング (今月)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm">
                <th className="p-4 font-medium">順位</th>
                <th className="p-4 font-medium">作業者名</th>
                <th className="p-4 font-medium">出勤日数</th>
                <th className="p-4 font-medium">稼働時間</th>
                <th className="p-4 font-medium">概算給与</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workerStats.map((stat, idx) => (
                <tr key={stat.worker.id} className="hover:bg-gray-50 transition">
                  <td className="p-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                      idx === 1 ? 'bg-gray-200 text-gray-700' :
                      idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-gray-900">{stat.worker.name}</td>
                  <td className="p-4 text-gray-600">{stat.shifts} 日</td>
                  <td className="p-4 font-mono font-medium text-blue-600">{stat.hours.toFixed(1)} h</td>
                  <td className="p-4 font-mono text-gray-700">¥{Math.floor(stat.cost).toLocaleString()}</td>
                </tr>
              ))}
              {workerStats.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    今月のデータがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
