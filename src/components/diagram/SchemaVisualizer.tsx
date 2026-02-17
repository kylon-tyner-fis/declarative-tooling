import React from "react";

interface SchemaVisualizerProps {
  jsonString: string;
}

const getTypeColor = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("str"))
    return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  if (t.includes("num") || t.includes("int"))
    return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  if (t.includes("boo"))
    return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  if (t.includes("arr"))
    return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
  if (t.includes("obj"))
    return "bg-purple-500/10 text-purple-600 border-purple-500/20";
  return "bg-primary/10 text-primary border-primary/20";
};

export default function SchemaVisualizer({
  jsonString,
}: SchemaVisualizerProps) {
  if (!jsonString) {
    return (
      <div className="text-[9px] text-muted-foreground/60 italic px-1 py-2 bg-muted/20 rounded border border-dashed text-center">
        No schema defined
      </div>
    );
  }

  let fields: { name: string; type: string }[] = [];
  let isInvalid = false;

  try {
    const obj = JSON.parse(jsonString);
    const properties = obj.properties || obj;

    fields = Object.entries(properties)
      .slice(0, 4)
      .map(([key, val]: [string, any]) => {
        let typeLabel = val.type || typeof val;
        if (typeLabel === "array") {
          const itemType = val.items?.type
            ? val.items.type.substring(0, 3)
            : "any";
          typeLabel = `arr[${itemType}]`;
        } else {
          typeLabel = typeLabel.substring(0, 3);
        }
        return { name: key, type: typeLabel };
      });
  } catch (e) {
    isInvalid = true;
  }

  if (isInvalid) {
    return (
      <div className="text-[8px] text-destructive bg-destructive/10 px-2 py-1 rounded border border-destructive/20 font-medium">
        ⚠️ Invalid Schema
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border/50 bg-muted/30 mt-2 shadow-inner">
      {fields.map((field, i) => (
        <div
          key={field.name}
          className={`flex items-center justify-between gap-3 px-2.5 py-1.5 transition-colors hover:bg-muted/60 ${
            i !== fields.length - 1 ? "border-b border-border/40" : ""
          }`}
        >
          <span className="text-[9px] font-mono font-bold text-foreground/80 truncate max-w-27.5">
            {field.name}
          </span>
          <span
            className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-lg border leading-none shrink-0 tabular-nums tracking-tighter shadow-sm ${getTypeColor(
              field.type,
            )}`}
          >
            {field.type}
          </span>
        </div>
      ))}
      {fields.length === 0 && (
        <div className="text-[8px] text-muted-foreground italic p-2 text-center">
          Empty Object
        </div>
      )}
    </div>
  );
}
