import { Paperclip } from 'lucide-react';

const FilePicker = ({
  label = 'Файлы',
  buttonText = 'Выбрать файлы',
  multiple = true,
  accept,
  files = [],
  onChange,
  helperText,
  disabled = false,
}) => {
  const hasFiles = Array.isArray(files) && files.length > 0;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
        </label>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <label
          className={[
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition cursor-pointer',
            disabled
              ? 'border-border bg-muted/30 text-muted-foreground opacity-60 cursor-not-allowed'
              : 'border-border bg-background text-foreground hover:bg-muted/30',
          ].join(' ')}
        >
          <Paperclip size={16} className={disabled ? 'text-muted-foreground' : 'text-primary'} />
          {buttonText}
          <input
            type="file"
            multiple={multiple}
            accept={accept}
            disabled={disabled}
            className="hidden"
            onChange={(e) => {
              if (disabled) return;
              const selected = Array.from(e.target.files || []);
              onChange?.(selected);
              e.target.value = '';
            }}
          />
        </label>

        {hasFiles ? (
          <span className="text-xs text-muted-foreground max-w-full truncate">
            {files.length} файл(ов): {files.map((f) => f.name).join(', ')}
          </span>
        ) : (
          helperText && <span className="text-xs text-muted-foreground">{helperText}</span>
        )}
      </div>
    </div>
  );
};

export default FilePicker;

