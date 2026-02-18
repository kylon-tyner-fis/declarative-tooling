export const OutputDisplay = ({ data }: { data: any }) => {
  if (data === null || data === undefined)
    return (
      <span className="text-muted-foreground text-xs italic">
        No output data
      </span>
    );

  // Handle Arrays
  if (Array.isArray(data)) {
    if (data.length === 0)
      return (
        <span className="text-muted-foreground text-xs italic">Empty List</span>
      );

    const isPrimitives = data.every((i) => typeof i !== "object");
    if (isPrimitives) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {data.map((item, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs rounded-md font-medium border border-emerald-500/20"
            >
              {String(item)}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3">
        {data.map((item, i) => (
          <div
            key={i}
            className="pl-3 border-l-2 border-border/60 hover:border-emerald-500/30 transition-colors"
          >
            <OutputDisplay data={item} />
          </div>
        ))}
      </div>
    );
  }

  // Handle Objects
  if (typeof data === "object") {
    return (
      <div className="flex flex-col gap-3">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="group">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest group-hover:text-emerald-600 transition-colors">
                {key}
              </span>
              <div className="h-px bg-border flex-1 opacity-20 group-hover:opacity-50 transition-opacity" />
            </div>
            <div className="pl-1 text-sm text-foreground/90 font-medium leading-relaxed">
              <OutputDisplay data={value} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span>{String(data)}</span>;
};
