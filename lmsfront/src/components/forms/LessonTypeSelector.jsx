import { BookOpen, Video, FlaskConical, ClipboardList } from 'lucide-react';

const LESSON_TYPES = [
  {
    type: 'lecture',
    label: 'Лекция',
    description: 'Текстовый материал с изображениями',
    icon: BookOpen,
    available: true,
  },
  {
    type: 'video',
    label: 'Видео',
    description: 'Видеоурок по ссылке',
    icon: Video,
    available: true,
  },
  {
    type: 'practica',
    label: 'Практика',
    description: 'Задание для самостоятельной работы',
    icon: FlaskConical,
    available: false,
  },
  {
    type: 'test',
    label: 'Тест',
    description: 'Вопросы с вариантами ответов',
    icon: ClipboardList,
    available: false,
  },
];

const LessonTypeSelector = ({ selectedType, onSelectType }) => {
  return (
    <div className="mb-8">
      <p className="text-sm font-medium text-foreground mb-3">Тип урока</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {LESSON_TYPES.map(({ type, label, description, icon: Icon, available }) => (
          <button
            key={type}
            type="button"
            disabled={!available}
            onClick={() => available && onSelectType(type)}
            className={`
              relative flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition
              ${!available
                ? 'border-border opacity-40 cursor-not-allowed bg-muted/30'
                : selectedType === type
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30 cursor-pointer'
              }
            `}
          >
            {!available && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full whitespace-nowrap">
                Скоро
              </span>
            )}
            <Icon size={20} className={selectedType === type ? 'text-primary' : 'text-muted-foreground'} />
            <div>
              <p className="text-sm font-medium leading-none mb-1">{label}</p>
              <p className="text-[11px] text-muted-foreground leading-snug">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LessonTypeSelector;
