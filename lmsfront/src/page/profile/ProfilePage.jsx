import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/Header';
import { useAuthUser } from '../../hooks/useAuthUser';
import PersonalInfoTab from './PersonalInfoTab';
import AuthorizationTab from './AuthorizationTab';

const ProfilePage = () => {
  const { user, updateUser, uploadAvatarImage, deleteUser, changePassword } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('personal')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'auth') {
      setActiveTab('auth')
    }
  }, [searchParams])

  return (
     <div className="min-h-screen bg-background">
      <Helmet>
        <title>Профиль</title>
      </Helmet>
      <Header />
      <Toaster position="top-center" />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex gap-6 border-b border-border mb-8">
          <button
            onClick={() => setActiveTab('personal')}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === 'personal'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Личная информация
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === 'auth'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Авторизация
          </button>
        </div>

        {activeTab === 'personal' && (
          <PersonalInfoTab
            user={user}
            updateUser={updateUser}
            uploadAvatarImage={uploadAvatarImage}
            deleteUser={deleteUser}
          />
        )}
        {activeTab === 'auth' && <AuthorizationTab user={user} changePassword={changePassword} />}
      </main>
    </div>
  );
};

export default ProfilePage;
