import { API } from '../../services/api';
import { authFetch } from '../../services/authFetch';
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useAuthUser } from '../../hooks/useAuthUser';
import Sidebar from '../../components/Sidebar';
import { Users } from 'lucide-react';

const AdminPage = () => {
  const { user } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();


  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <Toaster position="top-center" />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Обзор системы</h1>
            <p className="text-muted-foreground mt-1">
              Добро пожаловать в панель администратора
            </p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <div className='bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm relative overflow-hidden'>
              <div className='px-6 p-6'>
               <div className='flex items-center justify-between'>
                 <div>
                  <p className='text-sm text-muted-foreground'>Всего пользователей</p>
                  <p className='text-3xl font-bold text-foreground mt-1'>10</p>
                 </div>
                 <div className='w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center'>
                    <Users className="w-6 h-6 text-white" />
                 </div>
               </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
