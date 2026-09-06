from dataclasses import dataclass, field
from typing import Any, List


@dataclass
class CheckpointContext:
    checkpoint_id: str
    developer_intent: str
    assumptions_made: str
    unresolved_risks: str
    agent_code_snapshot: str
    modified_files: List[str] = field(default_factory=list)


def _text(value: Any) -> str:
    """
    Converts strings, lists and other values into clean text.
    """
    if value is None:
        return ""

    if isinstance(value, list):
        return "\n".join(str(item) for item in value)

    if isinstance(value, dict):
        return "\n".join(
            f"{key}: {value}"
            for key, value in value.items()
        )

    return str(value)


def _first(data: dict, keys: list[str], default=""):
    """
    Returns the first available key.
    """
    for key in keys:
        if key in data and data[key] is not None:
            return data[key]

    return default


def parse_checkpoint(data: dict) -> CheckpointContext:
    """
    Converts incoming checkpoint JSON into a normalized structure.

    Supports multiple possible field names so the backend can work
    with different checkpoint formats.
    """

    checkpoint_id = _text(
        _first(
            data,
            ["checkpoint_id", "id", "checkpointId"],
            "checkpoint-demo-001"
        )
    )

    developer_intent = _text(
        _first(
            data,
            [
                "developer_intent",
                "intent",
                "developerIntent",
                "objective"
            ]
        )
    )

    assumptions = _text(
        _first(
            data,
            [
                "assumptions_made",
                "assumptions",
                "developer_assumptions"
            ]
        )
    )

    risks = _text(
        _first(
            data,
            [
                "unresolved_risks",
                "risks",
                "unresolvedRisks"
            ]
        )
    )

    code = _text(
        _first(
            data,
            [
                "agent_code_snapshot",
                "current_implementation",
                "code",
                "agent_code",
                "diff"
            ]
        )
    )

    files = _first(
        data,
        [
            "modified_files",
            "affected_files",
            "files"
        ],
        []
    )

    if isinstance(files, str):
        files = [files]

    if not isinstance(files, list):
        files = []

    return CheckpointContext(
        checkpoint_id=checkpoint_id,
        developer_intent=developer_intent,
        assumptions_made=assumptions,
        unresolved_risks=risks,
        agent_code_snapshot=code,
        modified_files=[str(file) for file in files],
    )