import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import toast, { Toaster } from 'react-hot-toast';
import { Settings, Mail, Image, Save } from 'lucide-react';

import { useAdmin } from '../../hooks/useAdmin';
import Sidebar from '../../components/Sidebar';

const SettingAdminPage = () => {
  const { fetchSettings, updateSettings } = useAdmin();

  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    site_name: '',
    site_description: '',
    support_email: '',
    logo_url: '',
    logo_horizontal_url: '',
    smtp_host: '',
    smtp_port: '',
    smtp_user: '',
    smtp_password: '',
    smtp_from: '',
  });

  const [files, setFiles] = useState({
    logo_file: null,
    logo_horizontal_file: null,
  });

  useEffect(() => {
    fetchSettings()
      .then((data) => {
        setForm({
          site_name: data.site_name || '',
          site_description: data.site_description || '',
          support_email: data.support_email || '',
          logo_url: data.logo_url || '',
          logo_horizontal_url: data.logo_horizontal_url || '',
          smtp_host: data.smtp_host || '',
          smtp_port: data.smtp_port || '',
          smtp_user: data.smtp_user || '',
          smtp_password: '',
          smtp_from: data.smtp_from || '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: f } = e.target;
    if (f?.[0]) {
      setFiles((prev) => ({ ...prev, [name]: f[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      smtp_port: form.smtp_port ? Number(form.smtp_port) : null,
    };

    await updateSettings(payload, files);
  };

  if (loading) return <div className="p-8">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-background flex">
      <Helmet>
        <title>Настройки платформы</title>
      </Helmet>

      <Sidebar />
      <Toaster position="top-center" />

      <main className="md:ml-64 flex-1 overflow-auto">
        <div className="p-8">

          {/* HEADER */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Настройки</h1>
              <p className="text-muted-foreground mt-1">
                Конфигурация платформы
              </p>
            </div>

            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-foreground hover:bg-muted/40 transition"
            >
              <Save size={14} />
              Сохранить
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ОБЩИЕ */}
            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold">Общие настройки</h2>
                <p className="text-xs text-muted-foreground">
                  Основная информация о платформе
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Название сайта</label>
                <input
                  name="site_name"
                  value={form.site_name}
                  onChange={handleChange}
                  placeholder="My Platform"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Описание</label>
                <input
                  name="site_description"
                  value={form.site_description}
                  onChange={handleChange}
                  placeholder="Описание платформы"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Email поддержки</label>
                <input
                  name="support_email"
                  value={form.support_email}
                  onChange={handleChange}
                  placeholder="support@email.com"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold">Брендинг</h2>
                <p className="text-xs text-muted-foreground">
                  Логотипы платформы
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Логотип</label>

                <div className="flex items-center gap-4">
                  {(files.logo_file || form.logo_url) && (
                    <img
                      src={
                        files.logo_file
                          ? URL.createObjectURL(files.logo_file)
                          : form.logo_url
                      }
                      className="h-14 w-14 object-contain rounded-lg border"
                    />
                  )}

                  <label className="cursor-pointer px-4 py-2 rounded-xl border text-sm hover:bg-muted/40 transition">
                    Загрузить
                    <input
                      type="file"
                      name="logo_file"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Горизонтальный логотип</label>

                <div className="flex items-center gap-4">
                  {(files.logo_horizontal_file || form.logo_horizontal_url) && (
                    <img
                      src={
                        files.logo_horizontal_file
                          ? URL.createObjectURL(files.logo_horizontal_file)
                          : form.logo_horizontal_url
                      }
                      className="h-12 object-contain rounded-lg border"
                    />
                  )}

                  <label className="cursor-pointer px-4 py-2 rounded-xl border text-sm hover:bg-muted/40 transition">
                    Загрузить
                    <input
                      type="file"
                      name="logo_horizontal_file"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-5 lg:col-span-2">
              <div>
                <h2 className="text-lg font-semibold">Email (SMTP)</h2>
                <p className="text-xs text-muted-foreground">
                  Настройки отправки писем
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">SMTP Host</label>
                  <input
                    name="smtp_host"
                    value={form.smtp_host}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">SMTP Port</label>
                  <input
                    name="smtp_port"
                    value={form.smtp_port}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">SMTP User</label>
                  <input
                    name="smtp_user"
                    value={form.smtp_user}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">SMTP Password</label>
                  <input
                    type="password"
                    name="smtp_password"
                    value={form.smtp_password}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-sm font-medium">From Email</label>
                  <input
                    name="smtp_from"
                    value={form.smtp_from}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

              </div>
            </div>

          </div>        

        </div>
      </main>
    </div>
  );
};

export default SettingAdminPage;
