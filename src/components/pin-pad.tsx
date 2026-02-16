"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { X, Delete, CheckCircle2, XCircle } from "lucide-react";
import {
  findByPin,
  clockIn,
  clockOut,
  todayEntries,
  fmtTime,
} from "@/lib/timesheet-store";

interface PinPadProps {
  onExit: () => void;
  onClockAction: () => void;
}

type Result =
  | { type: "success"; name: string; action: "in" | "out"; time: string }
  | { type: "error" };

export function PinPad({ onExit, onClockAction }: PinPadProps) {
  const { t } = useLocale();
  const [digits, setDigits] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  function processPin(pin: string) {
    const emp = findByPin(pin);
    const now = fmtTime(new Date());

    if (!emp) {
      setResult({ type: "error" });
    } else {
      const entries = todayEntries(emp.id);
      const openEntry = entries.find((e) => e.clockOut === null);

      if (openEntry) {
        clockOut(openEntry.id);
        setResult({ type: "success", name: emp.name, action: "out", time: now });
      } else {
        clockIn(emp.id);
        setResult({ type: "success", name: emp.name, action: "in", time: now });
      }
      onClockAction();
    }

    setTimeout(() => {
      setDigits("");
      setResult(null);
    }, 3000);
  }

  function addDigit(d: string) {
    if (digits.length >= 4 || result) return;
    const next = digits + d;
    setDigits(next);
    if (next.length === 4) {
      processPin(next);
    }
  }

  function handleDelete() {
    if (!result) setDigits((prev) => prev.slice(0, -1));
  }

  function handleClear() {
    setDigits("");
    setResult(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-bold">{t.enterPin}</h2>
        <Button variant="ghost" size="sm" onClick={onExit}>
          <X className="mr-1 h-4 w-4" />
          {t.exitPinMode}
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
        {result ? (
          <div className="space-y-3 text-center">
            {result.type === "success" ? (
              <>
                <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
                <p className="text-2xl font-bold">{result.name}</p>
                <p className="text-lg text-muted-foreground">
                  {result.action === "in" ? t.clockedIn : t.clockedOut}{" "}
                  {result.time}
                </p>
              </>
            ) : (
              <>
                <XCircle className="mx-auto h-16 w-16 text-red-500" />
                <p className="text-xl font-bold">{t.wrongPin}</p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* PIN dots */}
            <div className="flex gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-5 w-5 rounded-full border-2 ${
                    i < digits.length
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                />
              ))}
            </div>

            {/* Number pad */}
            <div className="grid w-full max-w-[280px] grid-cols-3 gap-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                <Button
                  key={d}
                  variant="outline"
                  className="h-16 text-2xl font-medium"
                  onClick={() => addDigit(d)}
                >
                  {d}
                </Button>
              ))}
              <Button
                variant="ghost"
                className="h-16 text-sm"
                onClick={handleClear}
              >
                {t.clear}
              </Button>
              <Button
                variant="outline"
                className="h-16 text-2xl font-medium"
                onClick={() => addDigit("0")}
              >
                0
              </Button>
              <Button
                variant="ghost"
                className="h-16"
                onClick={handleDelete}
              >
                <Delete className="h-6 w-6" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
