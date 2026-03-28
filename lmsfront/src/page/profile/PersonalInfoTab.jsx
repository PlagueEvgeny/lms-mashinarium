import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Upload, X } from 'lucide-react';

function PersonalInfoTab({ user, updateUser, uploadAvatarImage, deleteUser }) {
  const [formData, setFormData] = useState({
    last_name: user?.last_name || '',
    first_name: user?.first_name || '',
    patronymic: user?.patronymic || '',
    avatar: user?.avatar || '',
    telegram: user?.telegram || '',
    phone: user?.phone || '',
    gender: user?.gender?.[0] || user?.gender || '',
    date_of_birth: user?.date_of_birth || '',
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    setFormData({
      last_name: user?.last_name || '',
      first_name: user?.first_name || '',
      patronymic: user?.patronymic || '',
      avatar: user?.avatar || '',
      telegram: user?.telegram || '',
      phone: user?.phone || '',
      gender: user?.gender?.[0] || user?.gender || '',
      date_of_birth: user?.date_of_birth || '',
    });
    setAvatarFile(null);
    setAvatarPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
  }, [user]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    e.target.value = '';
  };

  const handleAvatarRemove = () => {
    setAvatarFile(null);
    setAvatarPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
    handleChange('avatar', '');
  };

  const displayAvatarSrc = avatarPreview || formData.avatar || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let avatarUrl = formData.avatar;
      if (avatarFile) {
        avatarUrl = await uploadAvatarImage(avatarFile);
      }
      await updateUser({
        ...formData,
        avatar: avatarUrl,
        gender: formData.gender ? [formData.gender] : [],
      });
      setAvatarFile(null);
      setAvatarPreview((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return null;
      });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-muted overflow-hidden shrink-0">
          {displayAvatarSrc ? (
            <img
              src={displayAvatarSrc}
              alt={user?.first_name || ''}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-xl font-medium">
              {user?.first_name?.[0]}
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold">
            {user?.first_name} {user?.last_name}
          </h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold mb-6">Личная информация</h3>

        <div className="mb-6">
          {displayAvatarSrc ? (
            <div className="relative w-32 h-32 rounded-full overflow-hidden border border-border shrink-0">
              <img src={displayAvatarSrc} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={handleAvatarRemove}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black transition"
                aria-label="Убрать фото"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-32 h-32 rounded-full border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors">
              <Upload size={22} className="text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground text-center px-2">Загрузить</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
          )}
          {displayAvatarSrc && (
            <label className="inline-block mt-3 text-sm text-primary hover:underline cursor-pointer">
              Выбрать другое фото
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Фамилия</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Имя</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Отчество</label>
            <input
              type="text"
              name="patronymic"
              value={formData.patronymic}
              onChange={(e) => handleChange('patronymic', e.target.value)}
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Дата рождения</label>
            <input
              type="text"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={(e) => handleChange('date_of_birth', e.target.value)}
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Номер телефона</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Пол</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Выберите</option>
              <option value="MALE">Мужской</option>
              <option value="FEMALE">Женский</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Telegram</label>
            <input
              type="text"
              name="telegram"
              value={formData.telegram}
              onChange={(e) => handleChange('telegram', e.target.value)}
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Сохранить
        </button>
      </form>
      <div className="bg-card rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Удаление профиля</h3>
        <p className="text-sm text-muted-foreground mb-4">
          После запроса на удаление, ваш профиль и персональные данные будут полностью удалены через 30 дней. В
          течение этого времени вы можете написать в поддержку для отмены удаления.
        </p>
        <button
          onClick={async () => {
            if (confirm('Удалить аккаунт?')) deleteUser();
          }}
          className="border border-destructive text-destructive px-6 py-3 rounded-lg font-medium hover:bg-destructive/10 transition-colors"
        >
          Удалить профиль
        </button>
      </div>
    </div>
  );
}

export default PersonalInfoTab;
