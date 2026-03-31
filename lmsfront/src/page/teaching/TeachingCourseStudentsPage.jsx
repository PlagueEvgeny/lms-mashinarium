import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Users } from 'lucide-react';
import Header from '../../components/Header';
import { useTeacher } from '../../hooks/useTeacher';

const TeachingCourseStudentsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { teachingCourseDetail } = useTeacher();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teachingCourseDetail(slug, { setCourse, setLoading, navigate, toast });
  }, [slug]);

  const students = useMemo(() => {
    const list = course?.students || [];
    return list.slice().sort((a, b) => (a.email || '').localeCompare(b.email || ''));
  }, [course?.students]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster position="top" />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <button
          onClick={() => navigate(`/teaching/courses/${slug}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          ← Назад к курсу
        </button>

        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <Users size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Студенты курса</h1>
              <p className="text-sm text-muted-foreground">{course.name}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              Всего: <span className="text-foreground font-medium">{students.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {students.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">Студенты не добавлены.</div>
          ) : (
            <div className="divide-y divide-border">
              {students.map((s) => (
                <div key={s.user_id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {s.first_name || s.last_name ? `${s.first_name || ''} ${s.last_name || ''}`.trim() : (s.email || 'Без имени')}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{s.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeachingCourseStudentsPage;

