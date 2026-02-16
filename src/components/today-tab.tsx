"use client";

import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogIn, LogOut } from "lucide-react";
import {
  type Employee,
  todayEntries,
  calcHours,
  fmtHours,
} from "@/lib/timesheet-store";

interface TodayTabProps {
  employees: Employee[];
  onClockIn: (empId: string) => void;
  onClockOut: (entryId: string) => void;
}

function getStatus(empId: string) {
  const entries = todayEntries(empId);
  if (entries.length === 0) return { status: "idle" as const, entries };
  const last = entries[entries.length - 1];
  if (!last.clockOut)
    return { status: "working" as const, entries, activeEntry: last };
  return { status: "done" as const, entries };
}

function todayTotal(empId: string): number {
  return todayEntries(empId).reduce((sum, e) => sum + calcHours(e), 0);
}

export function TodayTab({ employees, onClockIn, onClockOut }: TodayTabProps) {
  const { t } = useLocale();

  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t.noEmployees}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {employees.map((emp) => {
        const { status, activeEntry } = getStatus(emp.id);
        const hrs = todayTotal(emp.id);
        return (
          <Card key={emp.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{emp.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  {status === "idle" && (
                    <Badge variant="outline">{t.notStarted}</Badge>
                  )}
                  {status === "working" && (
                    <Badge className="bg-green-100 text-green-700">
                      {t.working} · {fmtHours(hrs)}
                    </Badge>
                  )}
                  {status === "done" && (
                    <Badge variant="secondary">
                      {t.finished} · {fmtHours(hrs)}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    ${emp.hourlyRate}{t.perHour}
                  </span>
                </div>
              </div>
              <div>
                {status === "idle" && (
                  <Button size="sm" onClick={() => onClockIn(emp.id)}>
                    <LogIn className="mr-1 h-4 w-4" />
                    {t.clockIn}
                  </Button>
                )}
                {status === "working" && activeEntry && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onClockOut(activeEntry.id)}
                  >
                    <LogOut className="mr-1 h-4 w-4" />
                    {t.clockOut}
                  </Button>
                )}
                {status === "done" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onClockIn(emp.id)}
                  >
                    <LogIn className="mr-1 h-4 w-4" />
                    {t.clockIn}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
