"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Trash2,
  Code,
  List,
  AlertCircle,
  Undo2,
  Redo2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface SchemaBuilderProps {
  schemaString: string;
  onChange: (newSchema: string) => void;
  readOnly?: boolean;
}

interface SchemaField {
  id: string;
  name: string;
  type: string; // Stores "string", "array[string]", "array[object]", etc.
  description: string;
  required: boolean;
}

const PRIMITIVES = ["string", "number", "boolean", "object", "any"];

// --- Helper: Parse/Serialize Types ---

// Converts "array[array[string]]" -> JSON Schema object
const parseTypeToSchema = (typeStr: string): any => {
  if (typeStr.startsWith("array[")) {
    // Extract content between first [ and last ]
    const inner = typeStr.substring(6, typeStr.lastIndexOf("]"));
    return {
      type: "array",
      items: parseTypeToSchema(inner),
    };
  }
  return { type: typeStr };
};

// Converts JSON Schema object -> "array[string]"
const parseSchemaToType = (val: any): string => {
  if (!val) return "string";
  if (val.type === "array") {
    const inner = val.items ? parseSchemaToType(val.items) : "any";
    return `array[${inner}]`;
  }
  return val.type || "string";
};

// --- Sub-Component: Recursive Type Selector ---

const TypeSelector = ({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) => {
  const isArray = value.startsWith("array[");
  const innerType = isArray ? value.substring(6, value.lastIndexOf("]")) : "";

  const handleMainTypeChange = (newType: string) => {
    if (newType === "array") {
      // Default to array of strings if switching to array
      onChange("array[string]");
    } else {
      onChange(newType);
    }
  };

  const handleInnerChange = (newInner: string) => {
    onChange(`array[${newInner}]`);
  };

  return (
    <div className="flex items-center gap-1 min-w-0">
      <select
        className="flex h-7 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        value={isArray ? "array" : value}
        onChange={(e) => handleMainTypeChange(e.target.value)}
        disabled={disabled}
      >
        {[...PRIMITIVES, "array"].map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      {isArray && (
        <>
          <ChevronRight className="size-3 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-[80px]">
            <TypeSelector
              value={innerType}
              onChange={handleInnerChange}
              disabled={disabled}
            />
          </div>
        </>
      )}
    </div>
  );
};

// --- Main Component ---

export function SchemaBuilder({
  schemaString,
  onChange,
  readOnly,
}: SchemaBuilderProps) {
  const [mode, setMode] = useState<"visual" | "code">("visual");
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // --- Local History Stack ---
  const [history, setHistory] = useState<SchemaField[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  // Initialize fields from schema string
  useEffect(() => {
    if (mode === "visual") {
      try {
        const schema = JSON.parse(schemaString || "{}");
        if (
          schema.type !== "object" &&
          Object.keys(schema).length > 0 &&
          !schema.properties
        ) {
          setFields([]);
          return;
        }

        const props = schema.properties || {};
        const required = new Set(
          Array.isArray(schema.required) ? schema.required : [],
        );

        const newFields: SchemaField[] = Object.entries(props).map(
          ([key, value]: [string, any]) => ({
            id: crypto.randomUUID(),
            name: key,
            type: parseSchemaToType(value),
            description: value.description || "",
            required: required.has(key),
          }),
        );

        setFields(newFields);
        // Initialize history
        setHistory([newFields]);
        setHistoryIndex(0);
        setParseError(null);
      } catch (e) {
        setParseError("Invalid JSON");
        setMode("code");
      }
    }
  }, [mode]); // Only run on mode switch or mount, NOT on schemaString change to avoid loops

  // Push to history
  const pushToHistory = (newFields: SchemaField[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newFields);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const prevFields = history[historyIndex - 1];
      setFields(prevFields);
      setHistoryIndex(historyIndex - 1);
      updateSchemaFromFields(prevFields);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const nextFields = history[historyIndex + 1];
      setFields(nextFields);
      setHistoryIndex(historyIndex + 1);
      updateSchemaFromFields(nextFields);
    }
  }, [history, historyIndex]);

  // Keyboard Listeners for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        // Stop propagation to prevent global diagram undo
        e.stopPropagation();
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };

    if (mode === "visual" && !readOnly) {
      // Attach to the window or a specific container if focused?
      // For dialogs, attaching to window is usually safe while open.
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [mode, readOnly, handleUndo, handleRedo]);

  // Reconstruct JSON schema from fields
  const updateSchemaFromFields = useCallback(
    (currentFields: SchemaField[]) => {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      currentFields.forEach((field) => {
        if (!field.name) return;

        const typeSchema = parseTypeToSchema(field.type);

        properties[field.name] = {
          ...typeSchema,
          description: field.description,
        };
        if (field.required) {
          required.push(field.name);
        }
      });

      const newSchema = {
        type: "object",
        properties,
        required: required.length > 0 ? required : undefined,
      };

      onChange(JSON.stringify(newSchema, null, 2));
    },
    [onChange],
  );

  // Handle Field Mutations
  const updateFields = (newFields: SchemaField[]) => {
    setFields(newFields);
    pushToHistory(newFields);
    updateSchemaFromFields(newFields);
  };

  const handleFieldChange = (
    id: string,
    key: keyof SchemaField,
    value: any,
  ) => {
    const updatedFields = fields.map((f) =>
      f.id === id ? { ...f, [key]: value } : f,
    );
    updateFields(updatedFields);
  };

  const addField = () => {
    const newField: SchemaField = {
      id: crypto.randomUUID(),
      name: `field_${fields.length + 1}`,
      type: "string",
      description: "",
      required: false,
    };
    updateFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    const updated = fields.filter((f) => f.id !== id);
    updateFields(updated);
  };

  if (mode === "code") {
    return (
      <div className="space-y-2">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode("visual")}
            className="h-6 text-[10px]"
          >
            <List className="size-3 mr-1" /> Visual Editor
          </Button>
        </div>
        <Textarea
          className="font-mono text-[10px] min-h-[200px] whitespace-pre"
          value={schemaString}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
        {parseError && (
          <div className="text-[10px] text-destructive flex items-center gap-1">
            <AlertCircle className="size-3" /> {parseError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 group/builder" tabIndex={0}>
      <div className="flex justify-between items-center">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="size-3" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMode("code")}
          className="h-6 text-[10px]"
        >
          <Code className="size-3 mr-1" /> Raw JSON
        </Button>
      </div>

      <div className="border rounded-md divide-y bg-background">
        <div className="grid grid-cols-12 gap-2 p-2 bg-muted/50 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          <div className="col-span-3">Name</div>
          <div className="col-span-4">Type</div>
          <div className="col-span-4">Description</div>
          <div className="col-span-1"></div>
        </div>

        {fields.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground/50 italic border-dashed">
            No fields defined.
          </div>
        ) : (
          fields.map((field) => (
            <div
              key={field.id}
              className="grid grid-cols-12 gap-2 p-2 items-start hover:bg-muted/20 transition-colors"
            >
              <div className="col-span-3 pt-0.5">
                <Input
                  className="h-7 text-xs font-mono font-semibold"
                  value={field.name}
                  onChange={(e) =>
                    handleFieldChange(field.id, "name", e.target.value)
                  }
                  placeholder="field_name"
                  readOnly={readOnly}
                />
              </div>
              <div className="col-span-4 pt-0.5">
                <TypeSelector
                  value={field.type}
                  onChange={(val) => handleFieldChange(field.id, "type", val)}
                  disabled={readOnly}
                />
              </div>
              <div className="col-span-4">
                <Textarea
                  className="min-h-[28px] h-7 text-xs py-1 leading-tight resize-y"
                  value={field.description}
                  onChange={(e) =>
                    handleFieldChange(field.id, "description", e.target.value)
                  }
                  placeholder="Description..."
                  readOnly={readOnly}
                />
              </div>
              <div className="col-span-1 flex justify-end pt-0.5">
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-50 hover:opacity-100 transition-opacity"
                    onClick={() => removeField(field.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {!readOnly && (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs border-dashed text-muted-foreground hover:text-primary"
          onClick={addField}
        >
          <Plus className="size-3 mr-1" /> Add Field
        </Button>
      )}
    </div>
  );
}
