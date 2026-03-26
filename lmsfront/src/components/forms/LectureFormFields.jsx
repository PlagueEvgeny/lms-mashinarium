import { Plus, X, Upload } from 'lucide-react';

const LectureFormFields = ({ form, onChange }) => {
  const addImage = () => {
    onChange('images', [...(form.images || []), '']);
  };
  
  const removeImage = (i) => {
    onChange('images', form.images.filter((_, idx) => idx !== i));
  };
  
  const updateImage = (i, value) => {
    const updated = [...form.images];
    updated[i] = value;
    onChange('images', updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Содержание <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-muted-foreground mb-2">Поддерживается Markdown</p>
        <textarea
          value={form.content}
          onChange={e => onChange('content', e.target.value)}
          placeholder="# Заголовок&#10;&#10;Текст урока..."
          rows={12}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition font-mono text-sm resize-y"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-foreground">Изображения</label>
          <button
            type="button"
            onClick={addImage}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition"
          >
            <Plus size={14} /> Добавить
          </button>
        </div>

        {form.images?.length > 0 ? (
          <div className="space-y-2">
            {form.images.map((imgUrl, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    value={imgUrl}
                    onChange={e => updateImage(i, e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="p-2 text-muted-foreground hover:text-red-500 transition mt-0.5"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-border text-muted-foreground text-sm">
            <Upload size={16} />
            Нажмите «Добавить» чтобы прикрепить изображения
          </div>
        )}
      </div>
    </div>
  );
};

export default LectureFormFields;
