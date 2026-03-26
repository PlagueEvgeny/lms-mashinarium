import { Link } from 'lucide-react';

const VideoFormFields = ({ form, onChange }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        Ссылка на видео <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <Link size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="url"
          value={form.video_url}
          onChange={e => onChange('video_url', e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">YouTube, Vimeo или прямая ссылка на видео</p>
    </div>

    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        Длительность (в секундах)
      </label>
      <input
        type="number"
        value={form.duration}
        onChange={e => onChange('duration', parseInt(e.target.value) || null)}
        placeholder="3600"
        min={0}
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
      />
      {form.duration > 0 && (
        <p className="text-xs text-muted-foreground mt-1.5">
          ≈ {Math.floor(form.duration / 60)} мин {form.duration % 60} сек
        </p>
      )}
    </div>
  </div>
);

export default VideoFormFields;
