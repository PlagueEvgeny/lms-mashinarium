const LessonBaseFields = ({ form, onChange }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        Название урока <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        value={form.name}
        onChange={e => onChange('name', e.target.value)}
        placeholder="Введение в Python"
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Slug <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.slug}
          onChange={e => onChange('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
          placeholder="intro-to-python"
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition font-mono text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Порядок отображения <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={Number.isFinite(form.display_order) ? form.display_order : 1}
          onChange={e => onChange('display_order', e.target.value === '' ? 1 : parseInt(e.target.value, 10))}
          min={1}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
        />
      </div>
    </div>
  </div>
);

export default LessonBaseFields;
