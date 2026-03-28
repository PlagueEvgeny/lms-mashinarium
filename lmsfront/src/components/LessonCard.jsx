import toast from 'react-hot-toast';
import { FileText, Video, ClipboardList, HelpCircle, Lock } from 'lucide-react';

const lessonTypeIcons = {
  lecture: FileText,
  video: Video,
  practica: ClipboardList,
  test: HelpCircle,
};

const LessonCard = ({ navigate, courseSlug, moduleSlug, lesson, locked = false }) => {
  const LessonIcon = lessonTypeIcons[lesson.lesson_type] || FileText;
  const colors = {
    lecture: 'bg-accent/20 border-accent',
    video: 'bg-primary/20 border-primary',
    practica: 'bg-primary/10 border-primary/50',
    test: 'bg-accent/10 border-accent/50',
  };

  const go = () => {
    if (locked) {
      toast.error('Сначала завершите предыдущие занятия: отправьте практику или пройдите тест.');
      return;
    }
    navigate(`/user/courses/${courseSlug}/modules/${moduleSlug}/lessons/${lesson.slug}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          go();
        }
      }}
      className={`relative block p-4 rounded-xl border-2 ${colors[lesson.lesson_type]} transition-all ${
        locked ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'
      }`}
    >
      {locked && (
        <div className="absolute top-2 right-2 flex items-center justify-center rounded-md bg-background/90 p-1 border border-border">
          <Lock className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
        </div>
      )}
      <div className="aspect-square flex items-center justify-center mb-2">
        <div className="w-16 h-16 rounded-xl bg-card flex items-center justify-center">
          <LessonIcon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-xs text-center text-foreground">{lesson.name}</p>
    </div>
  );
};

export default LessonCard;
