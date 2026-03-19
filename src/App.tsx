import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useStore } from './store';
import type { AppState } from './types';
import { Login } from './components/Login';
import { Home } from './components/Home';
import { CalendarView as Calendar } from './components/Calendar';
import { Dashboard } from './components/Dashboard';
import { Monthly } from './components/Monthly';
import { Settings } from './components/Settings';

function Navigation() {
  const currentUser = useStore((state: AppState) => state.currentUser);
  const location = useLocation();
  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  const navClass = (path: string) => 
    `whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      location.pathname.startsWith(path) 
        ? 'bg-green-800 text-white' 
        : 'text-green-50 hover:bg-green-700 border border-transparent'
    }`;

  return (
    <nav className="bg-green-600 px-4 pb-3 flex gap-2 overflow-x-auto shadow-md">
      <div className="max-w-5xl w-full mx-auto flex gap-2">
        <Link to="/home" className={navClass('/home')}>作業ホーム</Link>
        <Link to="/calendar" className={navClass('/calendar')}>履歴カレンダー</Link>
        {isAdmin && (
          <>
            <Link to="/dashboard" className={navClass('/dashboard')}>ダッシュボード</Link>
            <Link to="/monthly" className={navClass('/monthly')}>月次詳細</Link>
            <Link to="/settings" className={navClass('/settings')}>設定</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function App() {
  const currentUser = useStore((state: AppState) => state.currentUser);
  const fetchInitialData = useStore((state: AppState) => state.fetchInitialData);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <header className="bg-green-600 text-white p-4 shadow-md flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">スマート勤怠マスター</h1>
          {currentUser && (
            <div className="flex items-center gap-4">
              <span className="font-medium">{currentUser.name}</span>
              <button 
                onClick={() => useStore.getState().setCurrentUser(null)}
                className="text-sm bg-green-700 px-3 py-1 rounded hover:bg-green-800 transition"
              >
                ログアウト
              </button>
            </div>
          )}
        </header>

        <Navigation />

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">
          <Routes>
            <Route path="/" element={!currentUser ? <Login /> : <Navigate to={currentUser.role === 'admin' ? '/dashboard' : '/home'} />} />
            <Route path="/home" element={currentUser ? <Home /> : <Navigate to="/" />} />
            <Route path="/calendar" element={currentUser ? <Calendar /> : <Navigate to="/" />} />
            <Route path="/dashboard" element={currentUser?.role === 'admin' ? <Dashboard /> : <Navigate to="/" />} />
            <Route path="/monthly" element={currentUser?.role === 'admin' ? <Monthly /> : <Navigate to="/" />} />
            <Route path="/settings" element={currentUser?.role === 'admin' ? <Settings /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
