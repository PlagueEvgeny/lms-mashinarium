import { useState } from 'react'

function AuthorizationTab({ user, changePassword }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      alert('Пароли не совпадают')
      return
    }

    if (newPassword.length < 6) {
      alert('Пароль должен быть не менее 6 символов')
      return
    }

    setIsLoading(true)

    try {
      await changePassword(currentPassword, newPassword)
      
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
    } catch (error) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className='flex items-center gap-4 mb-8'>
        <div className='w-16 h-16 rounded-full bg-muted overflow-hidden'>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.first_name} className='w-full h-full object-cover' />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-xl font-medium">
              {user?.first_name?.[0]}
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold">{user?.last_name} {user?.first_name}</h2>
          <p className='text-sm text-muted-foreground'>{user?.email}</p>
        </div> 
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className='bg-card rounded-xl p-6 mb-6'>
          <h3 className='text-lg font-semibold mb-4'>Почта</h3>
          <p className='text-primary font-medium mb-2'>{user?.email}</p>
          <p className='text-sm text-muted-foreground'>Для смены почты, пожалуйста обратитесь в поддержку</p>
        </div>
        
        <div className='bg-card rounded-xl p-6'>
          <h3 className='text-lg font-semibold mb-6'>Смена пароля</h3>
          <div className='max-w-md space-y-4'>
            <div>
              <label className='block text-xs text-muted-foreground mb-1'>Текущий пароль</label>
              <input 
                type="password" 
                name="currentPassword" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={isLoading}
              />
            </div>
            
            <h3 className='text-sm font-semibold pt-4'>Новый пароль</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className='block text-xs text-muted-foreground mb-1'>Новый пароль</label>
                <input 
                  type="password" 
                  name="newPassword" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className='block text-xs text-muted-foreground mb-1'>Подтверждение пароля</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div>
              <button 
                type="submit" 
                className={`bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'Сохранение...' : 'Подтвердить'}
              </button>
            </div>  
          </div>
        </div>
      </form>
   </div> 
  );
};

export default AuthorizationTab;
