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
  type: string;
  description: string;
  required: boolean;
}

const PRIMITIVES = ["string", "number", "boolean", "object", "any"];

const parseTypeToSchema = (typeStr: string): any => {
  if (typeStr.startsWith("array[")) {
    const inner = typeStr.substring(6, typeStr.lastIndexOf("]"));
    return {
      type: "array",
      items: parseTypeToSchema(inner),
    };
  }
  return { type: typeStr };
};

const parseSchemaToType = (val: any): string => {
  if (!val) return "string";
  if (val.type === "array") {
    const inner = val.items ? parseSchemaToType(val.items) : "any";
    return `array[${inner}]`;
  }
  return val.type || "string";
};

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
      onChange("array[string]");
    } else {
      onChange(newType);
    }
  };

  return (
    <div className="flex items-center gap-1 min-w-0">
      <select
        className="flex h-7 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
              onChange={(newInner) => onChange(`array[${newInner}]`)}
              disabled={disabled}
            />
          </div>
        </>
      )}
    </div>
  );
};

export function SchemaBuilder({
  schemaString,
  onChange,
  readOnly,
}: SchemaBuilderProps) {
  const [mode, setMode] = useState<"visual" | "code">("visual");
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [history, setHistory] = useState<SchemaField[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Sync internal state with external schemaString (e.g., from AI generation)
  useEffect(() => {
    if (mode === "visual") {
      try {
        const schema = JSON.parse(schemaString || "{}");
        const props = schema.properties || {};
        const incomingPropKeys = Object.keys(props);

        // Only update if current internal fields differ from external string
        if (incomingPropKeys.length !== fields.length || fields.length === 0) {
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
          setHistory([newFields]);
          setHistoryIndex(0);
        }
        setParseError(null);
      } catch (e) {
        // Mode remains code if parsing fails
      }
    }
  }, [schemaString, mode]);

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
        if (field.required) required.push(field.name);
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

  const updateFields = (newFields: SchemaField[]) => {
    setFields(newFields);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newFields);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    updateSchemaFromFields(newFields);
  };

  const handleFieldChange = (
    id: string,
    key: keyof SchemaField,
    value: any,
  ) => {
    updateFields(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
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
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMode("code")}
          className="h-6 text-[10px]"
        >
          <Code className="size-3 mr-1" /> Raw JSON
        </Button>
      </div>
      <div className="border rounded-md divide-y bg-background text-xs">
        <div className="grid grid-cols-12 gap-2 p-2 bg-muted/50 font-bold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-3">Name</div>
          <div className="col-span-4">Type</div>
          <div className="col-span-4">Description</div>
        </div>
        {fields.map((field) => (
          <div
            key={field.id}
            className="grid grid-cols-12 gap-2 p-2 items-start"
          >
            <div className="col-span-3">
              <Input
                className="h-7"
                value={field.name}
                onChange={(e) =>
                  handleFieldChange(field.id, "name", e.target.value)
                }
                readOnly={readOnly}
              />
            </div>
            <div className="col-span-4">
              <TypeSelector
                value={field.type}
                onChange={(val) => handleFieldChange(field.id, "type", val)}
                disabled={readOnly}
              />
            </div>
            <div className="col-span-4">
              <Textarea
                className="h-7 min-h-7 py-1"
                value={field.description}
                onChange={(e) =>
                  handleFieldChange(field.id, "description", e.target.value)
                }
                readOnly={readOnly}
              />
            </div>
            <div className="col-span-1">
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    updateFields(fields.filter((f) => f.id !== field.id))
                  }
                >
                  <Trash2 className="size-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      {!readOnly && (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 border-dashed"
          onClick={() =>
            updateFields([
              ...fields,
              {
                id: crypto.randomUUID(),
                name: `field_${fields.length + 1}`,
                type: "string",
                description: "",
                required: false,
              },
            ])
          }
        >
          <Plus className="size-3 mr-1" /> Add Field
        </Button>
      )}
    </div>
  );
}
