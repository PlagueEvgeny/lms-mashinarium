import { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { BookOpen, Users, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useAdmin } from '../../hooks/useAdmin';
import Sidebar from '../../components/Sidebar';
import { parseLogLines, isError } from '../../utility/logParser';
import RecentActivityCard from '../../components/admin/RecentActivityCard';
import RecentErrorsCard   from '../../components/admin/RecentErrorsCard';

const AdminPage = () => {
  const { user } = useAuthUser();
  const { fetchListUser, fetchListCourse, fetchLogs } = useAdmin();

  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const usersCount = users?.length  || 0;
  const courseCount = courses?.length || 0;
  const errorsCount = logs.filter(isError).length;

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const data = await fetchLogs(50);
      const lines = Array.isArray(data?.logs) ? data.logs : [];
      setLogs(parseLogLines(lines));
    } catch {
    } finally {
      setLogsLoading(false);
    }
  }, [fetchLogs]);

  useEffect(() => { fetchListUser().then(setUsers).catch(console.error); }, []);
  useEffect(() => { fetchListCourse().then(setCourses).catch(console.error); }, []);
  useEffect(() => { loadLogs(); }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <Toaster position="top-center" />
      <main className="md:ml-64 flex-1 overflow-auto">
        <div className="p-8">

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Обзор системы</h1>
              <p className="text-muted-foreground mt-1">Добро пожаловать в панель администратора</p>
            </div>
            <button
              onClick={loadLogs}
              disabled={logsLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-foreground hover:bg-muted/40 transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={logsLoading ? 'animate-spin' : ''} />
              Обновить логи
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Всего пользователей', value: usersCount,  color: 'bg-blue-500',  icon: Users },
              { label: 'Всего курсов',         value: courseCount, color: 'bg-green-500', icon: BookOpen },
              { label: 'Ошибок в логах',       value: errorsCount, color: 'bg-red-500',   icon: AlertCircle },
              { label: 'Событий в логах',      value: logs.length, color: 'bg-primary',   icon: Clock },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="bg-card text-card-foreground flex flex-col rounded-xl border py-6 shadow-sm">
                <div className="px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivityCard logs={logs} />
            <RecentErrorsCard   logs={logs} />
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminPage;
