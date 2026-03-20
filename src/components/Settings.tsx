import { useState } from 'react';
import { useStore } from '../store';
import { UserCog, Plus, Trash2, Save } from 'lucide-react';

export const Settings = () => {
  const users = useStore(state => state.users);
  const addUser = useStore(state => state.addUser);
  const updateUser = useStore(state => state.updateUser);
  const deleteUser = useStore(state => state.deleteUser);
  const currentUser = useStore(state => state.currentUser);

  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newHourlyRate, setNewHourlyRate] = useState('');
  const [newRole, setNewRole] = useState<'worker' | 'admin'>('worker');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPin || newPin.length !== 4) return;
    
    addUser({
      name: newName,
      pin: newPin,
      hourly_rate: Number(newHourlyRate) || 0,
      role: newRole
    });

    setNewName('');
    setNewPin('');
    setNewHourlyRate('');
    setNewRole('worker');
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center gap-3">
        <UserCog className="w-8 h-8 text-gray-600" />
        <h2 className="text-2xl font-bold text-gray-800">設定・作業者管理</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" />
              新規ユーザー追加
            </h3>
            
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN (4桁の数字)</label>
                <input 
                  type="text" 
                  pattern="[0-9]*"
                  maxLength={4}
                  value={newPin} 
                  onChange={e => {
                    const val = e.target.value.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/[^0-9]/g, '');
                    setNewPin(val);
                  }} 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none tracking-widest font-mono" 
                  placeholder="0000"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">時給 (円)</label>
                <input 
                  type="number" 
                  min="0"
                  value={newHourlyRate} 
                  onChange={e => setNewHourlyRate(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">権限</label>
                <select 
                  value={newRole} 
                  onChange={e => setNewRole(e.target.value as 'worker' | 'admin')} 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="worker">作業者</option>
                  <option value="admin">管理者</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition"
              >
                追加する
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg">登録ユーザー一覧</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm">
                    <th className="p-4 font-medium border-b">名前</th>
                    <th className="p-4 font-medium border-b">権限</th>
                    <th className="p-4 font-medium border-b">PIN</th>
                    <th className="p-4 font-medium border-b text-right">時給</th>
                    <th className="p-4 font-medium border-b text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-medium text-gray-900">
                        <input
                          type="text"
                          value={user.name}
                          onChange={(e) => updateUser(user.id, { name: e.target.value })}
                          className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-green-500 outline-none px-1 py-0.5 w-full max-w-[150px]"
                        />
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {user.role === 'admin' ? '管理者' : '作業者'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-gray-500 text-sm">
                        <input
                          type="text"
                          maxLength={4}
                          value={user.pin}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/[^0-9]/g, '');
                            updateUser(user.id, { pin: val });
                          }}
                          className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-green-500 outline-none px-1 py-0.5 w-16 text-center tracking-widest"
                        />
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end">
                          <span className="text-gray-400 mr-1">¥</span>
                          <input
                            type="number"
                            value={user.hourly_rate}
                            onChange={(e) => updateUser(user.id, { hourly_rate: Number(e.target.value) || 0 })}
                            className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-green-500 outline-none px-1 py-0.5 w-20 text-right"
                          />
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm('本当に削除しますか？')) {
                              deleteUser(user.id);
                            }
                          }}
                          disabled={user.id === currentUser?.id}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title="削除"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-gray-50 text-sm text-gray-500 flex items-center gap-2 border-t border-gray-100">
              <Save className="w-4 h-4" />
              値は入力すると自動で保存されます。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
