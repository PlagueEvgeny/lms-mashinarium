import { useState, useEffect } from 'react'

function AuthorizationTab({ user }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

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
              {user?.first_name?.[0]}
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

export default AuthorizationTab;

