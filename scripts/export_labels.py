#!/usr/bin/env python3
"""
Label Export Script

This script processes downloaded JSONL label files from the labeling interface
and exports them to CSV format for analysis.

Usage:
    python scripts/export_labels.py <input_jsonl> <output_csv>

Example:
    python scripts/export_labels.py labels/labeler_1.jsonl labels/labeler_1.csv
"""

import json
import csv
import sys
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime


def parse_jsonl(file_path: Path) -> List[Dict[str, Any]]:
    """Parse a JSONL file and return a list of label records."""
    labels = []

    with open(file_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue

            try:
                record = json.loads(line)
                labels.append(record)
            except json.JSONDecodeError as e:
                print(f"Warning: Skipping malformed JSON on line {line_num}: {e}", file=sys.stderr)
                continue

    return labels


def flatten_label(label: Dict[str, Any]) -> Dict[str, Any]:
    """Flatten a label record for CSV export."""
    flattened = {
        'task_id': label.get('task_id', ''),
        'labeler_id': label.get('labeler_id', ''),
        'timestamp': label.get('timestamp', ''),
        'time_spent_seconds': label.get('time_spent_seconds', ''),
    }

    # Add primary standard
    standards = label.get('standards', [])
    if standards:
        primary = standards[0]
        flattened['primary_standard_id'] = primary.get('id', '')
        flattened['primary_standard_code'] = primary.get('code', '')
        flattened['primary_standard_description'] = primary.get('description', '')

        # Add secondary standards (comma-separated)
        if len(standards) > 1:
            secondary_ids = [s.get('id', '') for s in standards[1:]]
            secondary_codes = [s.get('code', '') for s in standards[1:]]
            flattened['secondary_standard_ids'] = ', '.join(secondary_ids)
            flattened['secondary_standard_codes'] = ', '.join(secondary_codes)
        else:
            flattened['secondary_standard_ids'] = ''
            flattened['secondary_standard_codes'] = ''
    else:
        flattened['primary_standard_id'] = ''
        flattened['primary_standard_code'] = ''
        flattened['primary_standard_description'] = ''
        flattened['secondary_standard_ids'] = ''
        flattened['secondary_standard_codes'] = ''

    return flattened


def export_to_csv(labels: List[Dict[str, Any]], output_path: Path) -> None:
    """Export labels to CSV format."""
    if not labels:
        print("Warning: No labels to export", file=sys.stderr)
        return

    # Flatten all labels
    flattened_labels = [flatten_label(label) for label in labels]

    # Get all unique field names
    fieldnames = [
        'task_id',
        'labeler_id',
        'timestamp',
        'time_spent_seconds',
        'primary_standard_id',
        'primary_standard_code',
        'primary_standard_description',
        'secondary_standard_ids',
        'secondary_standard_codes',
    ]

    # Write CSV
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(flattened_labels)

    print(f"Exported {len(labels)} labels to {output_path}")


def main():
    """Main entry point."""
    if len(sys.argv) != 3:
        print("Usage: python scripts/export_labels.py <input_jsonl> <output_csv>", file=sys.stderr)
        print("\nExample:", file=sys.stderr)
        print("  python scripts/export_labels.py labels/labeler_1.jsonl labels/labeler_1.csv", file=sys.stderr)
        sys.exit(1)

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])

    # Validate input file
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    if not input_path.suffix == '.jsonl':
        print(f"Warning: Input file does not have .jsonl extension: {input_path}", file=sys.stderr)

    # Create output directory if needed
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Parse and export
    print(f"Reading labels from {input_path}...")
    labels = parse_jsonl(input_path)

    print(f"Exporting {len(labels)} labels to CSV...")
    export_to_csv(labels, output_path)

    print("Done!")


if __name__ == '__main__':
    main()
