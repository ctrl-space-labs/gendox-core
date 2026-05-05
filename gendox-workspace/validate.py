"""
Validate SDK digitization output against manually created test data.

Usage:
    python validate.py <sdk_output.json> <test_data.json|csv>

Match key: register_book_number
Ignored fields: _page (internal SDK metadata)
"""

import csv
import json
import sys
from pathlib import Path

MATCH_KEY = "register_book_number"
IGNORE_FIELDS = {"_page"}


def load_file(path: Path) -> list[dict]:
    if path.suffix.lower() == ".csv":
        with path.open(encoding="utf-8-sig") as f:
            return list(csv.DictReader(f))
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError(f"{path} must contain a JSON array at the top level")
    return data


def normalize(value) -> str:
    """Normalize a value for comparison: strip whitespace, lower None to empty."""
    if value is None:
        return ""
    return str(value).strip()


def build_index(records: list[dict], source_label: str) -> dict[str, dict]:
    index = {}
    for rec in records:
        key = normalize(rec.get(MATCH_KEY, ""))
        if not key:
            print(f"  [WARN] {source_label}: record missing '{MATCH_KEY}' — skipped: {rec}")
            continue
        if key in index:
            print(f"  [WARN] {source_label}: duplicate '{MATCH_KEY}' = {key!r} — keeping first")
        else:
            index[key] = rec
    return index


def compare_records(key: str, sdk: dict, expected: dict) -> list[str]:
    """Return list of mismatch descriptions for this record."""
    mismatches = []

    sdk_fields = {k for k in sdk if k not in IGNORE_FIELDS}
    exp_fields = {k for k in expected if k not in IGNORE_FIELDS}
    all_fields = sdk_fields | exp_fields

    for field in sorted(all_fields):
        sdk_val = normalize(sdk.get(field))
        exp_val = normalize(expected.get(field))
        if sdk_val != exp_val:
            if field not in sdk:
                mismatches.append(f"  Field '{field}': MISSING in SDK output (expected: {exp_val!r})")
            elif field not in expected:
                mismatches.append(f"  Field '{field}': extra in SDK output (value: {sdk_val!r}), not in test data")
            else:
                mismatches.append(f"  Field '{field}': got {sdk_val!r}, expected {exp_val!r}")

    return mismatches


def main(sdk_path: Path, test_path: Path) -> None:
    print(f"\nLoading SDK output:  {sdk_path}")
    print(f"Loading test data:   {test_path}\n")

    sdk_records  = load_file(sdk_path)
    test_records = load_file(test_path)

    sdk_index  = build_index(sdk_records,  "SDK output")
    test_index = build_index(test_records, "Test data")

    missing_from_sdk   = []  # in test, not in SDK
    extra_in_sdk       = []  # in SDK, not in test
    records_with_diffs = []  # matched but differ
    records_ok         = []  # matched and identical

    for key, expected in test_index.items():
        if key not in sdk_index:
            missing_from_sdk.append(key)
        else:
            diffs = compare_records(key, sdk_index[key], expected)
            if diffs:
                records_with_diffs.append((key, diffs))
            else:
                records_ok.append(key)

    for key in sdk_index:
        if key not in test_index:
            extra_in_sdk.append(key)

    # ── Report ────────────────────────────────────────────────────────────────

    if missing_from_sdk:
        print(f"{'─'*60}")
        print(f"MISSING FROM SDK ({len(missing_from_sdk)} records in test data but not in SDK output):")
        for k in sorted(missing_from_sdk, key=lambda x: int(x) if x.isdigit() else x):
            print(f"  {MATCH_KEY}={k}")

    if extra_in_sdk:
        print(f"{'─'*60}")
        print(f"EXTRA IN SDK ({len(extra_in_sdk)} records in SDK output not in test data):")
        for k in sorted(extra_in_sdk, key=lambda x: int(x) if x.isdigit() else x):
            print(f"  {MATCH_KEY}={k}")

    if records_with_diffs:
        print(f"{'─'*60}")
        print(f"FIELD MISMATCHES ({len(records_with_diffs)} records):")
        for key, diffs in sorted(records_with_diffs, key=lambda x: int(x[0]) if x[0].isdigit() else x[0]):
            print(f"\n  {MATCH_KEY}={key}")
            for d in diffs:
                print(d)

    print(f"\n{'═'*60}")
    print(f"  SUMMARY")
    print(f"{'═'*60}")
    print(f"  SDK records:      {len(sdk_index)}")
    print(f"  Test records:     {len(test_index)}")
    print(f"  Matched exactly:  {len(records_ok)}")
    print(f"  With mismatches:  {len(records_with_diffs)}")
    print(f"  Missing from SDK: {len(missing_from_sdk)}")
    print(f"  Extra in SDK:     {len(extra_in_sdk)}")
    print(f"{'═'*60}\n")

    if records_with_diffs or missing_from_sdk:
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"Usage: python {sys.argv[0]} <sdk_output.json> <test_data.json|csv>")
        sys.exit(1)

    main(Path(sys.argv[1]), Path(sys.argv[2]))
