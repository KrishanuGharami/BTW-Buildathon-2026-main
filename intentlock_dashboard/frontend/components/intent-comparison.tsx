"use client";

import * as React from "react";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Code2,
  GitCompareArrows,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";


export type IntentField = {
  id: string;
  label: string;
  human: string;
  ai: string;
  mismatch: boolean;
  severity?: "low" | "medium" | "high" | "critical";
  explanation?: string;
};


type IntentComparisonProps = {
  fields: IntentField[];
  driftScore: number;
  affectedFiles: string[];
  regressionDetected: boolean;
  riskLevel: string;
  reportSummary: string;
};


const severityClasses: Record<string, string> = {
  critical:
    "border-red-500/30 bg-red-500/10 text-red-400",

  high:
    "border-orange-500/30 bg-orange-500/10 text-orange-400",

  medium:
    "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",

  low:
    "border-blue-500/30 bg-blue-500/10 text-blue-400",
};


function SeverityBadge({
  severity,
}: {
  severity?: IntentField["severity"];
}) {

  if (!severity) return null;

  return (
    <Badge
      variant="outline"
      className={severityClasses[severity]}
    >
      {severity.toUpperCase()}
    </Badge>
  );
}


function ComparisonValue({
  value,
  mismatch,
}: {
  value: string;
  mismatch: boolean;
}) {

  return (
    <div
      className={[
        "rounded-xl border p-4 text-sm leading-6",
        "transition-colors",
        mismatch
          ? "border-red-500/30 bg-red-500/5"
          : "border-border/60 bg-muted/20",
      ].join(" ")}
    >
      {value || "No information provided."}
    </div>
  );
}


function MobileComparisonRow({
  field,
}: {
  field: IntentField;
}) {

  return (
    <Collapsible className="rounded-2xl border border-border/60 bg-card">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-4 py-5"
        >
          <div className="flex items-center gap-3">
            {field.mismatch ? (
              <AlertTriangle className="h-4 w-4 text-red-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            )}

            <span className="font-medium">
              {field.label}
            </span>
          </div>

          <ChevronDown className="h-4 w-4" />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="px-4 pb-4">

        <div className="space-y-4">

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
              Human Intent
            </p>

            <ComparisonValue
              value={field.human}
              mismatch={false}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
              AI Implementation
            </p>

            <ComparisonValue
              value={field.ai}
              mismatch={field.mismatch}
            />
          </div>

          {field.mismatch && field.explanation && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-red-400">
                Why this is flagged
              </p>

              <p className="text-sm text-muted-foreground">
                {field.explanation}
              </p>
            </div>
          )}

        </div>

      </CollapsibleContent>
    </Collapsible>
  );
}


export function IntentComparison({
  fields,
  driftScore,
  affectedFiles,
  regressionDetected,
  riskLevel,
  reportSummary,
}: IntentComparisonProps) {

  const mismatches = fields.filter(
    (field) => field.mismatch
  );

  const mismatchPercentage =
    fields.length > 0
      ? Math.round(
          (mismatches.length / fields.length) * 100
        )
      : 0;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      {/* HEADER */}

      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

        <div>

          <div className="mb-3 flex items-center gap-2">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card">
              <GitCompareArrows className="h-5 w-5" />
            </div>

            <Badge variant="secondary">
              IntentLock Audit
            </Badge>

          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Intent vs AI Implementation
          </h1>

          <p className="mt-2 max-w-2xl text-muted-foreground">
            Compare the developer's original checkpoint intent
            against the active AI-generated implementation.
          </p>

        </div>


        <div
          className={[
            "rounded-2xl border px-5 py-4",
            regressionDetected
              ? "border-red-500/30 bg-red-500/5"
              : "border-emerald-500/30 bg-emerald-500/5",
          ].join(" ")}
        >

          <div className="flex items-center gap-3">

            {regressionDetected ? (
              <ShieldAlert className="h-5 w-5 text-red-400" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            )}

            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Audit Status
              </p>

              <p className="font-semibold">
                {regressionDetected
                  ? `${riskLevel} RISK`
                  : "SAFE"}
              </p>
            </div>

          </div>

        </div>

      </div>


      {/* METRICS */}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <Card className="p-5">

          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Drift Score
            </span>

            <Sparkles className="h-4 w-4" />
          </div>

          <div className="text-3xl font-bold">
            {driftScore}
          </div>

          <Progress
            value={driftScore}
            className="mt-3"
          />

        </Card>


        <Card className="p-5">

          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Mismatches
            </span>

            <AlertTriangle className="h-4 w-4" />
          </div>

          <div className="text-3xl font-bold">
            {mismatches.length}
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            {mismatchPercentage}% of compared fields
          </p>

        </Card>


        <Card className="p-5">

          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Affected Files
            </span>

            <Code2 className="h-4 w-4" />
          </div>

          <div className="text-3xl font-bold">
            {affectedFiles.length}
          </div>

        </Card>


        <Card className="p-5">

          <div className="mb-3">
            <span className="text-sm text-muted-foreground">
              Audit Result
            </span>
          </div>

          <Badge
            variant="outline"
            className={
              regressionDetected
                ? "border-red-500/30 text-red-400"
                : "border-emerald-500/30 text-emerald-400"
            }
          >
            {regressionDetected
              ? "REGRESSION DETECTED"
              : "NO REGRESSION"}
          </Badge>

        </Card>

      </div>


      {/* REPORT */}

      <Card className="mb-8 p-5">

        <div className="flex gap-4">

          <div className="mt-1">
            {regressionDetected ? (
              <AlertTriangle className="h-5 w-5 text-red-400" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            )}
          </div>

          <div>

            <h2 className="font-semibold">
              Audit Summary
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {reportSummary}
            </p>

          </div>

        </div>

      </Card>


      {/* DESKTOP COMPARISON */}

      <Card className="hidden overflow-hidden lg:block">

        <div className="grid grid-cols-[180px_1fr_1fr] border-b border-border/60">

          <div className="p-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Field
          </div>

          <div className="border-l border-border/60 p-5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-400" />
              <span className="font-semibold">
                Human Developer Intent
              </span>
            </div>
          </div>

          <div className="border-l border-border/60 p-5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-400" />
              <span className="font-semibold">
                Active AI Implementation
              </span>
            </div>
          </div>

        </div>


        {fields.map((field) => (

          <div
            key={field.id}
            className="grid grid-cols-[180px_1fr_1fr] border-b border-border/60 last:border-b-0"
          >

            <div className="p-5">

              <div className="flex flex-col gap-2">

                <span className="text-sm font-semibold">
                  {field.label}
                </span>

                {field.mismatch && (
                  <SeverityBadge
                    severity={field.severity}
                  />
                )}

              </div>

            </div>


            <div className="border-l border-border/60 p-5">

              <ComparisonValue
                value={field.human}
                mismatch={false}
              />

            </div>


            <div className="border-l border-border/60 p-5">

              <ComparisonValue
                value={field.ai}
                mismatch={field.mismatch}
              />

              {field.mismatch &&
                field.explanation && (

                  <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3">

                    <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                      Why flagged
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {field.explanation}
                    </p>

                  </div>
                )}

            </div>

          </div>

        ))}

      </Card>


      {/* MOBILE */}

      <div className="space-y-3 lg:hidden">

        {fields.map((field) => (
          <MobileComparisonRow
            key={field.id}
            field={field}
          />
        ))}

      </div>


      {/* AFFECTED FILES */}

      <Card className="mt-8 p-5">

        <div className="mb-4">

          <h2 className="font-semibold">
            Affected Files
          </h2>

          <p className="text-sm text-muted-foreground">
            Files involved in this checkpoint audit.
          </p>

        </div>

        <Separator className="mb-4" />

        <div className="flex flex-wrap gap-2">

          {affectedFiles.length === 0 ? (

            <span className="text-sm text-muted-foreground">
              No affected files reported.
            </span>

          ) : (

            affectedFiles.map((file) => (

              <Badge
                key={file}
                variant="secondary"
                className="font-mono text-xs"
              >
                {file}
              </Badge>

            ))

          )}

        </div>

      </Card>

    </section>
  );
}