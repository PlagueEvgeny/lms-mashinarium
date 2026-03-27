import { useState } from 'react';
import { useTeacher } from '../../hooks/useTeacher';
import MarkdownEditor from '../MarkdownEditor';
import toast from 'react-hot-toast';
import FilePicker from './FilePicker';

const PracticaFormFields = ({ form, onChange }) => {
  const { uploadLessonImage } = useTeacher();
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (file) => {
    setUploadingImage(true);
    try {
      const url = await uploadLessonImage(file);
      return url;
    } catch (err) {
      toast.error(err.message || 'Ошибка загрузки изображения');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Условие практики <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-muted-foreground mb-2">Поддерживается Markdown</p>
        <MarkdownEditor
          value={form.content}
          onChange={(val) => onChange('content', val)}
          onImageUpload={handleImageUpload}
          uploadingImage={uploadingImage}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Максимальный балл <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={form.max_score}
            onChange={(e) => onChange('max_score', parseInt(e.target.value || '0', 10))}
            min={0}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Срок (дни) <span className="text-muted-foreground">(необязательно)</span>
          </label>
          <input
            type="number"
            value={form.deadline_days ?? ''}
            onChange={(e) => onChange('deadline_days', e.target.value === '' ? null : parseInt(e.target.value, 10))}
            min={0}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>
      </div>

      <div className="space-y-2">
        <FilePicker
          label="Материалы (файлы)"
          files={form.materials || []}
          onChange={(selected) => onChange('materials', selected)}
          helperText="Можно прикрепить несколько файлов"
        />
      </div>
    </div>
  );
};

export default PracticaFormFields;

