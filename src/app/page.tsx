"use client";

import { useState, useEffect } from "react";
import { useLocale, LocalePicker } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Clock, Users, DollarSign, Share2 } from "lucide-react";
import {
  type Employee,
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  clockIn,
  clockOut,
} from "@/lib/timesheet-store";
import { TodayTab } from "@/components/today-tab";
import { EmployeesTab } from "@/components/employees-tab";
import { SummaryTab } from "@/components/summary-tab";

export default function HomePage() {
  const { t } = useLocale();
  const [employees, setEmployees] = useState<Employee[]>(() => getEmployees());
  const [, setTick] = useState(0);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [formName, setFormName] = useState("");
  const [formRate, setFormRate] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const reload = () => setEmployees(getEmployees());

  // Tick every 30s for live working hours
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // ── Employee Dialog ────────────────────────────

  function openAdd() {
    setEditingEmp(null);
    setFormName("");
    setFormRate("");
    setDialogOpen(true);
  }

  function openEdit(emp: Employee) {
    setEditingEmp(emp);
    setFormName(emp.name);
    setFormRate(String(emp.hourlyRate));
    setDialogOpen(true);
  }

  function handleSave() {
    const name = formName.trim();
    const rate = parseFloat(formRate);
    if (!name || isNaN(rate) || rate <= 0) return;
    if (editingEmp) {
      updateEmployee(editingEmp.id, { name, hourlyRate: rate });
    } else {
      addEmployee(name, rate);
    }
    setDialogOpen(false);
    reload();
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteEmployee(deleteTarget.id);
    setDeleteTarget(null);
    reload();
  }

  // ── Clock Actions ──────────────────────────────

  function handleClockIn(empId: string) {
    clockIn(empId);
    reload();
  }

  function handleClockOut(entryId: string) {
    clockOut(entryId);
    reload();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">{t.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={async () => {
                try {
                  const url = window.location.href;
                  if (navigator.share) {
                    await navigator.share({ title: t.title, url });
                  } else {
                    await navigator.clipboard.writeText(url);
                    alert(t.copied);
                  }
                } catch {
                  // User cancelled share sheet
                }
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <LocalePicker />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        <Tabs defaultValue="today">
          <TabsList className="w-full">
            <TabsTrigger value="today" className="flex-1">
              <Clock className="mr-1 h-4 w-4" />
              {t.todayTab}
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex-1">
              <Users className="mr-1 h-4 w-4" />
              {t.employeesTab}
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex-1">
              <DollarSign className="mr-1 h-4 w-4" />
              {t.summaryTab}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4">
            <TodayTab
              employees={employees}
              onClockIn={handleClockIn}
              onClockOut={handleClockOut}
            />
          </TabsContent>

          <TabsContent value="employees" className="mt-4">
            <EmployeesTab
              employees={employees}
              onAdd={openAdd}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          </TabsContent>

          <TabsContent value="summary" className="mt-4">
            <SummaryTab employees={employees} />
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t.poweredBy}
        </p>
      </main>

      {/* Add/Edit Employee Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingEmp ? t.editEmployee : t.addEmployee}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.employeeName}</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t.namePlaceholder}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>{t.hourlyRate}</Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.5"
                value={formRate}
                onChange={(e) => setFormRate(e.target.value)}
                placeholder={t.ratePlaceholder}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSave}>{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {t.delete} {deleteTarget?.name}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t.deleteConfirm}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
