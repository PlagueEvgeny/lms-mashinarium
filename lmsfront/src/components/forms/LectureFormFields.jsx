import { useState } from 'react';
import { useTeacher } from '../../hooks/useTeacher';
import MarkdownEditor from '../../components/MarkdownEditor';
import toast from 'react-hot-toast';

const LectureFormFields = ({ form, onChange }) => {
  const { uploadLessonImage } = useTeacher();
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (file) => {
    setUploadingImage(true);
    try {
      const url = await uploadLessonImage(file);
      onChange('images', [...(form.images || []), url]);
      return url;
    } catch (err) {
      toast.error(err.message || 'Ошибка загрузки изображения');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground mb-1.5">
        Содержание <span className="text-red-500">*</span>
      </label>
      <p className="text-xs text-muted-foreground mb-2">
        Поддерживается Markdown
      </p>
      <MarkdownEditor
        value={form.content}
        onChange={val => onChange('content', val)}
        onImageUpload={handleImageUpload}
        uploadingImage={uploadingImage}
      />
    </div>
  );
};

export default LectureFormFields;
