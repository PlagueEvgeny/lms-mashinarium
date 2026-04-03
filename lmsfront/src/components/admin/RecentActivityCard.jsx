import { getLevelConfig, isInfo } from '../../utility/logParser';

const RecentActivityCard = ({ logs }) => {
  const items = logs.filter(isInfo).slice(-8).reverse();

  return (
    <div className="bg-card text-card-foreground flex flex-col rounded-xl border shadow-sm">
      <div className="px-6 py-4 border-b border-border">
        <div className="font-semibold text-foreground">Последняя активность</div>
        <div className="text-muted-foreground text-sm mt-0.5">Недавние действия в системе</div>
      </div>
      <div className="px-6 py-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет данных</p>
        ) : items.map((log, i) => {
          const cfg = getLevelConfig(log.level);
          const Icon = cfg.icon;
          return (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
              <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon className={`w-4 h-4 ${cfg.cls}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{log.message}</p>
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

export default RecentActivityCard;
