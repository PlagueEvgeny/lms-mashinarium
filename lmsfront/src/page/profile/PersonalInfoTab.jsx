import { API } from '../../services/api';
import { authFetch } from '../../services/authFetch';
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useAuthUser } from '../../hooks/useAuthUser';


function PersonalInfoTab({ user, updateUser }) {
  const [formData, setFormData] = useState({
    last_name: user?.last_name || "",
    first_name: user?.first_name || "",
    patronymic: user?.patronymic || "",
    avatar: user?.avatar || "",
    telegram: user?.telegram || "",
    phone: user?.phone || "",
    gender: user?.gender || "",
    date_of_birth: user?.date_of_birth || ""
  });
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    updateUser(formData)
  }
  return (
    <div>
      <div className='flex items-center gap-4 mb-8'>
        <div className='w-16 h-16 rounded-full bg-muted overflow-hidden'>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.first_name}
            className='w-full h-full object-cover'
           / >
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-xl font-medium">
              {user?.firts_name?.[0]}
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold">{user?.first_name} {user?.last_name}</h2>
          <p className='text-sm text-muted-foreground'>{user?.email}</p>
        </div>
      </div>  
    </div>
  );
};

export default PersonalInfoTab;

