import { Edit, FileText, GripVertical, MoreVertical, Plus, Trash2, ChevronUp, ChevronDown, Video, ClipboardList, HelpCircle, Edit2 } from 'lucide-react';

const lessonTypeIcons = {
  lecture: FileText,
  video: Video,
  practica: ClipboardList,
  test: HelpCircle
}

const LessonCard = ({ navigate, courseSlug, moduleSlug, lesson }) => {
  const LessonIcon = lessonTypeIcons[lesson.lesson_type] || FileText
  const colors = {
    lecture: 'bg-accent/20 border-accent',
    video: 'bg-primary/20 border-primary',
    practica: 'bg-primary/10 border-primary/50',
    test: 'bg-accent/10 border-accent/50'
  }
  return (
    <div
      onClick={() => {navigate(`/user/courses/${courseSlug}/modules/${moduleSlug}/lessons/${lesson.slug}`);}}
      className={`block p-4 rounded-xl border-2 ${colors[lesson.lesson_type]} hover:shadow-md transition-all cursor-pointer`}
    >
      <div className='aspect-square flex items-center justify-center mb-2'>
        <div className='w-16 h-16 rounded-xl bg-card flex items-center justify-center'>
          <LessonIcon className="w-4 h-4" />
        </div>
      </div>
      <p className='text-xs text-center text-foreground'>{lesson.name}</p>
    </div>
  );
};

export default LessonCard;
