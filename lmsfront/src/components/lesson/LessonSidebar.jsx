import { BookOpen, Video, FlaskConical, ClipboardList, CheckCircle2, Lock, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const LESSON_ICONS = {
  lecture:  BookOpen,
  video:    Video,
  practica: FlaskConical,
  test:     ClipboardList,
};

const LESSON_LABELS = {
  lecture:  'Лекция',
  video:    'Видео',
  practica: 'Практика',
  test:     'Тест',
};

const LessonSidebar = ({ modules, currentSlug, onSelect, completedSlugs = [] }) => {
  const [collapsed, setCollapsed] = useState({});

  const toggleModule = (moduleId) => {
    setCollapsed(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedCount = completedSlugs.length;
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <aside className="flex flex-col gap-4">
      {/* Progress */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">Прогресс</span>
          <span className="text-sm font-semibold text-primary">{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {completedCount} из {totalLessons} уроков пройдено
        </p>
      </div>

      {/* Modules */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {modules.map((module, idx) => {
          const isOpen = !collapsed[module.id];
          return (
            <div key={module.id} className={idx > 0 ? 'border-t border-border' : ''}>
              {/* Module header */}
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">Модуль {idx + 1}</p>
                  <p className="text-sm font-medium text-foreground truncate">{module.name}</p>
                </div>
                {isOpen
                  ? <ChevronDown size={16} className="text-muted-foreground shrink-0 ml-2" />
                  : <ChevronRight size={16} className="text-muted-foreground shrink-0 ml-2" />
                }
              </button>

              {/* Lessons */}
              {isOpen && (
                <div className="border-t border-border">
                  {module.lessons
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((lesson) => {
                      const Icon = LESSON_ICONS[lesson.lesson_type] || BookOpen;
                      const isActive    = lesson.slug === currentSlug;
                      const isCompleted = completedSlugs.includes(lesson.slug);

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => onSelect(lesson.slug)}
                          className={`
                            w-full flex items-center gap-3 px-5 py-3.5 text-left transition border-b border-border last:border-b-0
                            ${isActive
                              ? 'bg-primary/8 text-primary'
                              : 'hover:bg-muted/30 text-foreground'
                            }
                          `}
                        >
                          {/* Status icon */}
                          <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                            isActive    ? 'bg-primary/15' :
                            isCompleted ? 'bg-green-500/10' :
                            'bg-muted'
                          }`}>
                            {isCompleted && !isActive
                              ? <CheckCircle2 size={14} className="text-green-500" />
                              : <Icon size={14} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                            }
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : ''}`}>
                              {lesson.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {LESSON_LABELS[lesson.lesson_type] || lesson.lesson_type}
                            </p>
                          </div>

                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          )}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default LessonSidebar;
