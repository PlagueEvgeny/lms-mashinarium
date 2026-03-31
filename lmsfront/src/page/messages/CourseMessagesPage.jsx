import { API } from '../../services/api';
import { authFetch } from '../../services/authFetch';
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/Header';
import { useAuthUser } from '../../hooks/useAuthUser';

const CourseMessagesPage = () => {
  const { user } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [dialogs, setDialogs] = useState([]); 
  useEffect(() => {
    const fetchDialogs = async () => {
      try {
        const response = await authFetch(API.dialogs);       
        if (!response.ok) throw new Error('Ошибка загрузки диалогов');
        const data = await response.json();
        setDialogs(data);
      } catch  (err) {
        setError(err);
        toast.error('Не удалось загрузить диалоги');
      } finally {
        setLoading(false);
      }
    };

    fetchDialogs();
  }, []);

  if (!setLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster position="top" />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="p-4 border-b border-border">
            <h1 className="text-3xl font-bold text-foreground">Диалоги</h1>
          </div>
          <div className="divide-y divide-border">
            {dialogs.map((dialog) => (
              <div onClick={() => navigate(`/dialog/${dialog.slug}`)}
                   className='flex cursor-pointer items-center gap-4 p-4 hover:bg-muted/50 transition-colors rounded-lg border-b-1'
                   key={dialog.id}>

                <img 
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-background group-hover:ring-primary/20 transition-all"
                  src={dialog.image} 
                  alt={dialog.name}
                />
                <span className='text-xl font-bold text-foreground'>{dialog.name}</span>

              </div> 
            ))} 
          </div>
      </main>
    </div>
  );
};

export default CourseMessagesPage;

