import re
from typing import Any

from checkpoint_parser import CheckpointContext


SECURITY_TERMS = [
    "authentication",
    "authorization",
    "session",
    "security",
    "password",
    "token",
    "permission",
    "credential",
    "jwt",
    "oauth",
]

TODO_TERMS = [
    "todo",
    "fixme",
    "not implemented",
    "unfinished",
    "placeholder",
    "coming soon",
]


def contains_any(text: str, terms: list[str]) -> bool:
    text_lower = text.lower()

    return any(
        term.lower() in text_lower
        for term in terms
    )


def calculate_drift_score(
    critical_count: int,
    high_count: int,
    medium_count: int,
    low_count: int,
) -> int:

    score = (
        critical_count * 35
        + high_count * 20
        + medium_count * 10
        + low_count * 5
    )

    return min(score, 100)


def analyze_checkpoint(
    context: CheckpointContext,
) -> dict[str, Any]:

    findings = []
    unfinished_requirements = []

    intent = context.developer_intent.lower()
    assumptions = context.assumptions_made.lower()
    risks = context.unresolved_risks.lower()
    code = context.agent_code_snapshot

    # ---------------------------------------------------------
    # 1. Authentication / security regression detection
    # ---------------------------------------------------------

    security_should_remain_unchanged = (
        "authentication" in intent
        or "authentication" in assumptions
        or "security" in intent
        or "security" in assumptions
        or "session" in assumptions
    ) and any(
        phrase in intent + assumptions
        for phrase in [
            "unchanged",
            "do not modify",
            "without modifying",
            "must remain",
            "should remain"
        ]
    )

    if security_should_remain_unchanged and contains_any(
        code,
        SECURITY_TERMS
    ):

        findings.append({
            "field": "assumptions",
            "severity": "critical",
            "message": (
                "The active implementation appears to touch "
                "authentication/security-sensitive behavior even "
                "though the checkpoint indicates that this area "
                "should remain unchanged."
            ),
        })

    # ---------------------------------------------------------
    # 2. Unresolved risk detection
    # ---------------------------------------------------------

    risk_keywords = []

    for word in re.findall(r"\b[a-zA-Z]{5,}\b", risks):
        if word.lower() not in {
            "should",
            "must",
            "needs",
            "review",
            "remain",
            "before",
            "after",
            "implementation",
        }:
            risk_keywords.append(word.lower())

    matched_risk_keywords = [
        word
        for word in risk_keywords
        if word in code.lower()
    ]

    if risks and not matched_risk_keywords:
        unfinished_requirements.append(
            "Review and resolve the checkpoint's unresolved risks."
        )

        findings.append({
            "field": "unresolved_risks",
            "severity": "high",
            "message": (
                "The checkpoint contains unresolved risks that "
                "cannot be verified as addressed in the active "
                "implementation."
            ),
        })

    # ---------------------------------------------------------
    # 3. TODO / unfinished implementation
    # ---------------------------------------------------------

    if contains_any(code, TODO_TERMS):

        unfinished_requirements.append(
            "Complete TODO / placeholder implementation markers."
        )

        findings.append({
            "field": "implementation",
            "severity": "medium",
            "message": (
                "The active implementation contains unfinished "
                "or placeholder work."
            ),
        })

    # ---------------------------------------------------------
    # 4. Scope detection
    # ---------------------------------------------------------

    scope_keywords = [
        "database",
        "payment",
        "authentication",
        "authorization",
        "deployment",
        "infrastructure",
    ]

    requested_scope = [
        word
        for word in scope_keywords
        if word in intent
    ]

    unexpected_scope = [
        word
        for word in scope_keywords
        if word in code.lower()
        and word not in requested_scope
    ]

    if unexpected_scope:

        findings.append({
            "field": "objective",
            "severity": "high",
            "message": (
                "The implementation appears to introduce behavior "
                "outside the checkpoint's stated scope: "
                + ", ".join(unexpected_scope)
            ),
        })

    # ---------------------------------------------------------
    # 5. Severity calculation
    # ---------------------------------------------------------

    critical_count = sum(
        finding["severity"] == "critical"
        for finding in findings
    )

    high_count = sum(
        finding["severity"] == "high"
        for finding in findings
    )

    medium_count = sum(
        finding["severity"] == "medium"
        for finding in findings
    )

    low_count = sum(
        finding["severity"] == "low"
        for finding in findings
    )

    drift_score = calculate_drift_score(
        critical_count,
        high_count,
        medium_count,
        low_count,
    )

    regression_detected = len(findings) > 0

    if critical_count:
        risk_level = "CRITICAL"
        severity = "CRITICAL REGRESSION"

    elif high_count:
        risk_level = "HIGH"
        severity = "HIGH REGRESSION"

    elif medium_count:
        risk_level = "MEDIUM"
        severity = "MEDIUM DRIFT"

    elif low_count:
        risk_level = "LOW"
        severity = "LOW DRIFT"

    else:
        risk_level = "SAFE"
        severity = "NO REGRESSION"

    # ---------------------------------------------------------
    # 6. Report summary
    # ---------------------------------------------------------

    if regression_detected:

        report_summary = (
            "IntentLock detected a mismatch between the historical "
            "developer checkpoint and the active AI-generated "
            "implementation. The implementation should be reviewed "
            "before the checkpoint is accepted."
        )

    else:

        report_summary = (
            "IntentLock found no significant mismatch between the "
            "developer checkpoint and the active implementation."
        )

    return {
        "checkpoint_id": context.checkpoint_id,

        "regression_detected": regression_detected,

        "risk_level": risk_level,

        "severity": severity,

        "drift_score": drift_score,

        "developer_intent": context.developer_intent,

        "assumptions_made": context.assumptions_made,

        "unresolved_risks": context.unresolved_risks,

        "current_implementation": context.agent_code_snapshot,

        "modified_files": context.modified_files,

        "affected_files": context.modified_files,

        "unfinished_requirements": unfinished_requirements,

        "detected_violations": findings,

        "report_summary": report_summary,
    }