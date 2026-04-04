import { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { BookOpen, Users, Clock, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useAdmin } from '../../hooks/useAdmin';
import Sidebar from '../../components/Sidebar';

const LogsAdminPage = () => {
  const { user } = useAuthUser();
  const { fetchListUser, fetchListCourse, fetchLogs } = useAdmin();
  const [ search, setSearch ] = useState('');

  const [ users, setUsers ] = useState([]);

  useEffect(() => { fetchListUser().then(setUsers).catch(console.error); }, []);
  
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <Toaster position="top-center" />
      <main className="md:ml-64 flex-1 overflow-auto">
        <div className='p-8'>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className='text-3xl font-bold text-foreground'>Журнал событий</h1>
              <p className='text-muted-foreground mt-1'>Просмотр истории событий</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LogsAdminPage;
