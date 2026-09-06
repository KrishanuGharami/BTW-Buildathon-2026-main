"use client";

import { useEffect, useState } from "react";

import {
  IntentComparison,
  IntentField,
} from "@/components/intent-comparison";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";


type AuditResponse = {
  checkpoint_id: string;

  regression_detected: boolean;

  risk_level: string;

  severity: string;

  drift_score: number;

  developer_intent: string;

  assumptions_made: string;

  unresolved_risks: string;

  current_implementation: string;

  modified_files: string[];

  affected_files: string[];

  unfinished_requirements: string[];

  detected_violations: {
    field: string;
    severity: "low" | "medium" | "high" | "critical";
    message: string;
  }[];

  report_summary: string;
};


function createFields(
  data: AuditResponse
): IntentField[] {

  const violationFor = (field: string) =>
    data.detected_violations.find(
      (item) => item.field === field
    );


  const objectiveViolation =
    violationFor("objective");

  const assumptionsViolation =
    violationFor("assumptions");

  const risksViolation =
    violationFor("unresolved_risks");

  const implementationViolation =
    violationFor("implementation");


  return [
    {
      id: "objective",

      label: "Objective",

      human:
        data.developer_intent ||
        "No developer intent provided.",

      ai:
        data.current_implementation ||
        "No implementation provided.",

      mismatch: Boolean(objectiveViolation),

      severity:
        objectiveViolation?.severity,

      explanation:
        objectiveViolation?.message,
    },


    {
      id: "assumptions",

      label: "Assumptions",

      human:
        data.assumptions_made ||
        "No assumptions recorded.",

      ai:
        implementationViolation?.message ||
        data.current_implementation ||
        "No implementation provided.",

      mismatch: Boolean(assumptionsViolation),

      severity:
        assumptionsViolation?.severity,

      explanation:
        assumptionsViolation?.message,
    },


    {
      id: "risks",

      label: "Unresolved Risks",

      human:
        data.unresolved_risks ||
        "No unresolved risks recorded.",

      ai:
        data.unfinished_requirements.length > 0
          ? data.unfinished_requirements.join("\n")
          : "No unfinished requirements detected.",

      mismatch: Boolean(risksViolation),

      severity:
        risksViolation?.severity,

      explanation:
        risksViolation?.message,
    },


    {
      id: "implementation",

      label: "Implementation",

      human:
        data.developer_intent ||
        "Checkpoint intent.",

      ai:
        data.current_implementation ||
        "No implementation provided.",

      mismatch:
        Boolean(implementationViolation),

      severity:
        implementationViolation?.severity,

      explanation:
        implementationViolation?.message,
    },
  ];
}


export default function Home() {

  const [data, setData] =
    useState<AuditResponse | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    async function loadAudit() {

      try {

        setLoading(true);

        const response = await fetch(
          `${API_URL}/api/demo`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Backend returned ${response.status}`
          );
        }

        const result =
          await response.json();

        setData(result);

      } catch (err) {

        setError(
          err instanceof Error
            ? err.message
            : "Failed to connect to backend."
        );

      } finally {

        setLoading(false);

      }
    }


    loadAudit();

  }, []);


  if (loading) {

    return (
      <main className="flex min-h-screen items-center justify-center">

        <div className="text-center">

          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />

          <p className="text-sm text-muted-foreground">
            Running IntentLock audit...
          </p>

        </div>

      </main>
    );
  }


  if (error) {

    return (
      <main className="flex min-h-screen items-center justify-center px-6">

        <div className="max-w-md rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center">

          <h1 className="font-semibold text-red-400">
            Backend Connection Failed
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>

          <p className="mt-4 text-xs text-muted-foreground">
            Make sure FastAPI is running on:
            <br />
            {API_URL}
          </p>

        </div>

      </main>
    );
  }


  if (!data) {

    return null;

  }


  return (
    <main className="min-h-screen bg-background">

      <IntentComparison
        fields={createFields(data)}
        driftScore={data.drift_score}
        affectedFiles={data.affected_files}
        regressionDetected={
          data.regression_detected
        }
        riskLevel={data.risk_level}
        reportSummary={data.report_summary}
      />

    </main>
  );
}