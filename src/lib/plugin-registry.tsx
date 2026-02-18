"use client";

import { UIPlugin, UIWidgetProps } from "@/types/plugins";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// --- DEFAULT PLUGIN ---
// Handles standard strings, numbers, and booleans
const DefaultPlugin: UIPlugin = {
  id: "default",
  name: "Standard Input",
  match: () => true, // Fallback for everything
  component: ({ value, onChange, schema, label }: UIWidgetProps) => {
    const type = schema.type || "string";
    const description = schema.description;

    return (
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase tracking-wider opacity-70">
          {label}
        </Label>
        {type === "string" &&
        (schema.maxLength > 100 ||
          label.toLowerCase().includes("description")) ? (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={description}
            className="text-xs min-h-20"
          />
        ) : (
          <Input
            type={type === "number" ? "number" : "text"}
            value={value || ""}
            onChange={(e) =>
              onChange(
                type === "number" ? Number(e.target.value) : e.target.value,
              )
            }
            placeholder={description}
            className="h-8 text-xs"
          />
        )}
      </div>
    );
  },
};

// --- REGISTRY CLASS ---
class PluginRegistry {
  private plugins: UIPlugin[] = [DefaultPlugin];

  register(plugin: UIPlugin) {
    // Add to the front so specialized plugins take precedence over default
    this.plugins.unshift(plugin);
  }

  getWidget(key: string, schema: any): UIPlugin {
    return this.plugins.find((p) => p.match(key, schema)) || DefaultPlugin;
  }
}

export const registry = new PluginRegistry();
