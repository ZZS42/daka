"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Share2 } from "lucide-react";
import {
  type Employee,
  totalHoursForEmployee,
  fmtHours,
  weekRange,
  monthRange,
  lastMonthRange,
} from "@/lib/timesheet-store";

interface SummaryTabProps {
  employees: Employee[];
}

type Range = "week" | "month" | "lastMonth";

const rangeMap = { week: weekRange, month: monthRange, lastMonth: lastMonthRange };

export function SummaryTab({ employees }: SummaryTabProps) {
  const { t } = useLocale();
  const [range, setRange] = useState<Range>("week");

  const [start, end] = rangeMap[range]();

  const rows = employees.map((emp) => {
    const hrs = totalHoursForEmployee(emp.id, start, end);
    return { emp, hrs, wage: hrs * emp.hourlyRate };
  });
  const grandHrs = rows.reduce((s, r) => s + r.hrs, 0);
  const grandWage = rows.reduce((s, r) => s + r.wage, 0);

  const rangeLabels: Record<Range, string> = {
    week: t.thisWeek,
    month: t.thisMonth,
    lastMonth: t.lastMonth,
  };

  async function handleShareWages() {
    const lines = rows
      .filter((r) => r.hrs > 0)
      .map((r) => `${r.emp.name}: ${fmtHours(r.hrs)} → $${r.wage.toFixed(2)}`);
    const text = [
      `📋 ${t.wageReport} — ${rangeLabels[range]}`,
      "───────────",
      ...lines,
      "───────────",
      `${t.grandTotal}: ${fmtHours(grandHrs)} → $${grandWage.toFixed(2)}`,
      "",
      `— ${t.poweredBy}`,
    ].join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        alert(t.copied);
      }
    } catch {
      // User cancelled share sheet
    }
  }

  const hasData = rows.some((r) => r.hrs > 0);

  return (
    <div className="space-y-4">
      {/* Range Picker + Share */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["week", "month", "lastMonth"] as const).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={range === r ? "default" : "outline"}
              onClick={() => setRange(r)}
            >
              {rangeLabels[r]}
            </Button>
          ))}
        </div>
        {hasData && (
          <Button size="sm" variant="outline" onClick={handleShareWages}>
            <Share2 className="mr-1 h-4 w-4" />
            {t.shareWages}
          </Button>
        )}
      </div>

      {employees.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t.noEmployees}
          </CardContent>
        </Card>
      ) : rows.every((r) => r.hrs === 0) ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t.noRecords}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.name}</TableHead>
                  <TableHead className="text-right">{t.hours}</TableHead>
                  <TableHead className="text-right">{t.rate}</TableHead>
                  <TableHead className="text-right">{t.wage}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows
                  .filter((r) => r.hrs > 0)
                  .map((r) => (
                    <TableRow key={r.emp.id}>
                      <TableCell className="font-medium">
                        {r.emp.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {fmtHours(r.hrs)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${r.emp.hourlyRate}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${r.wage.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>{t.grandTotal}</TableCell>
                  <TableCell className="text-right">
                    {fmtHours(grandHrs)}
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-right">
                    ${grandWage.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
