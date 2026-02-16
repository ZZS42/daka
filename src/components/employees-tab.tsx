"use client";

import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Employee } from "@/lib/timesheet-store";

interface EmployeesTabProps {
  employees: Employee[];
  onAdd: () => void;
  onEdit: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
}

export function EmployeesTab({
  employees,
  onAdd,
  onEdit,
  onDelete,
}: EmployeesTabProps) {
  const { t } = useLocale();

  return (
    <div className="space-y-3">
      <Button onClick={onAdd} className="w-full">
        <Plus className="mr-1 h-4 w-4" />
        {t.addEmployee}
      </Button>

      {employees.map((emp) => (
        <Card key={emp.id}>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">{emp.name}</p>
              <p className="text-sm text-muted-foreground">
                ${emp.hourlyRate}{t.perHour}
              </p>
              <p className="text-xs text-muted-foreground">
                {emp.pin ? `PIN: ${emp.pin}` : t.noPinSet}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(emp)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(emp)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
