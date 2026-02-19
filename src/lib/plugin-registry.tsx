"use client";

import { UIPlugin, UIWidgetProps } from "@/types/plugins";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown"; // Ensure this is installed
import { Code2, Type } from "lucide-react";

const StandardInputPlugin: UIPlugin = {
  id: "standard-input",
  name: "Standard Input",
  match: () => true, // Default fallback
  component: ({ value, onChange, label, schema }: UIWidgetProps) => {
    const type = schema.type || "string";
    const description = schema.description;

    return (
      <div className="space-y-2 animate-in fade-in duration-300">
        <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Type className="size-3" /> {label}
        </Label>
        {type === "string" &&
        (schema.maxLength > 100 ||
          label.toLowerCase().includes("description")) ? (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={description || "Enter text..."}
            className="text-xs min-h-20 bg-background shadow-sm"
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
            placeholder={description || `Enter ${label}...`}
            className="h-9 text-xs bg-background shadow-sm"
          />
        )}
      </div>
    );
  },
};

// --- MARKDOWN PLUGIN ---
const MarkdownPlugin: UIPlugin = {
  id: "markdown-viewer",
  name: "Markdown Viewer",
  // Match fields that look like long text or have "description"/"content" in the name
  match: (key, schema) =>
    schema.type === "string" &&
    (key.toLowerCase().includes("description") ||
      key.toLowerCase().includes("content")),
  component: ({ value, label }: UIWidgetProps) => (
    <div className="space-y-2">
      <Label className="text-[10px] font-black uppercase opacity-60">
        {label}
      </Label>
      <div className="prose prose-sm dark:prose-invert max-w-none border rounded-md p-4 bg-background shadow-sm">
        <ReactMarkdown>{value || "_No content generated_"}</ReactMarkdown>
      </div>
    </div>
  ),
};

// --- DEFAULT PLUGIN ---
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
          label.toLowerCase().includes("definition")) ? (
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

const CodeEditorPlugin: UIPlugin = {
  id: "code-editor",
  name: "Code Editor",
  // Match fields named "code", "submission", or "solution"
  match: (key) =>
    key.toLowerCase().includes("code") ||
    key.toLowerCase().includes("submission") ||
    key.toLowerCase().includes("solution"),
  component: ({ value, onChange, label, schema }: UIWidgetProps) => {
    const language = schema.language || "javascript";

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-1.5">
            <Code2 className="size-3" /> {label}
          </Label>
          <span className="text-[9px] font-mono bg-muted px-1.5 py-0.5 rounded border uppercase tracking-tighter text-muted-foreground">
            {language}
          </span>
        </div>
        <div className="relative group">
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            className="w-full h-64 p-4 font-mono text-xs bg-[#1e1e1e] text-[#d4d4d4] rounded-xl border-2 border-transparent focus:border-primary/50 outline-none transition-all resize-y shadow-2xl"
            placeholder={`// Write your ${language} solution here...`}
          />
          <div className="absolute bottom-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <p className="text-[8px] text-muted-foreground font-medium uppercase tracking-widest">
              Editor Mode
            </p>
          </div>
        </div>
      </div>
    );
  },
};

// --- REGISTRY CLASS ---
class PluginRegistry {
  private plugins: UIPlugin[] = [DefaultPlugin];

  constructor() {
    // Register specialized plugins first
    this.register(MarkdownPlugin);
    this.register(CodeEditorPlugin);
    this.register(StandardInputPlugin);
  }

  register(plugin: UIPlugin) {
    this.plugins.unshift(plugin);
  }

  getWidget(key: string, schema: any): UIPlugin {
    return this.plugins.find((p) => p.match(key, schema)) || DefaultPlugin;
  }

  getWidgetById(id: string): UIPlugin {
    return this.plugins.find((p) => p.id === id) || DefaultPlugin;
  }
}

export const registry = new PluginRegistry();
