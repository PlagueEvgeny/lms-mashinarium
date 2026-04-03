import { getLevelConfig, isError } from '../../utility/logParser';

const RecentErrorsCard = ({ logs }) => {
  const errors = logs.filter(isError).slice(-8).reverse();

  return (
    <div className="bg-card text-card-foreground flex flex-col rounded-xl border shadow-sm">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <div className="font-semibold text-foreground">Ошибки и предупреждения</div>
          <div className="text-muted-foreground text-sm mt-0.5">Последние проблемы в системе</div>
        </div>
        {errors.length > 0 && (
          <span className="text-xs font-semibold text-red-500 bg-red-500/10 px-2 py-1 rounded-full">
            {errors.length}
          </span>
        )}
      </div>
      <div className="px-6 py-4 space-y-2">
        {errors.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Ошибок нет
          </div>
        ) : errors.map((log, i) => {
          const cfg = getLevelConfig(log.level);
          const Icon = cfg.icon;
          return (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${cfg.bg}`}>
              <Icon className={`w-4 h-4 ${cfg.cls} shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${cfg.cls}`}>{log.message}</p>
                {log.source && (
                  <p className="text-xs text-muted-foreground truncate">{log.source}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{log.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentErrorsCard;
