"use client";

import { registry } from "@/lib/plugin-registry";

interface DynamicFormProps {
  schema: any;
  data: any;
  onChange: (newData: any) => void;
}

export function DynamicForm({ schema, data, onChange }: DynamicFormProps) {
  const properties = schema.properties || {};

  const handleFieldChange = (key: string, value: any) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-4 py-2">
      {Object.entries(properties).map(([key, propSchema]: [string, any]) => {
        const plugin = registry.getWidget(key, propSchema);
        const Widget = plugin.component;

        return (
          <Widget
            key={key}
            label={key}
            schema={propSchema}
            value={data[key]}
            onChange={(val) => handleFieldChange(key, val)}
          />
        );
      })}
    </div>
  );
}
