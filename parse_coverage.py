#!/usr/bin/env python3
"""
Parse vitest coverage-summary.json and generate coverage reports.
Usage: python3 parse_coverage.py [--directory src/app|src/components|src/actions]
"""

import json
import sys
from pathlib import Path
from typing import List, Tuple

def load_coverage_data(json_path: str = 'coverage/coverage-summary.json') -> dict:
    """Load coverage summary JSON file."""
    with open(json_path, 'r') as f:
        return json.load(f)

def get_files_below_threshold(data: dict, threshold: float = 100) -> List[Tuple[str, float, int, int, int]]:
    """Extract files below coverage threshold."""
    files = []
    repo_root = '/Users/diosvo/Documents/github/team-management'
    
    for filepath, metrics in data.items():
        if filepath == 'total':
            continue
        
        statement_pct = metrics['statements']['pct']
        if statement_pct < threshold:
            covered = metrics['statements']['covered']
            total = metrics['statements']['total']
            uncovered = total - covered
            rel_path = filepath.replace(repo_root + '/', '')
            files.append((rel_path, statement_pct, covered, total, uncovered))
    
    return sorted(files, key=lambda x: x[1])

def print_report(files: List[Tuple[str, float, int, int, int]], title: str = "Coverage Report"):
    """Print formatted coverage report."""
    print(f"\n{'=' * 90}")
    print(f"{title:<90}")
    print(f"{'=' * 90}")
    print(f"{'File Path':<60} {'Coverage':>10} {'Covered':>10} {'Uncovered':>10}")
    print(f"{'-' * 90}")
    
    for path, coverage, covered, total, uncovered in files:
        print(f"{path:<60} {coverage:>9.1f}% {covered:>10} {uncovered:>10}")
    
    print(f"\nTotal files: {len(files)}")
    
    # Statistics
    at_0 = sum(1 for _, cov, _, _, _ in files if cov == 0)
    at_0_50 = sum(1 for _, cov, _, _, _ in files if 0 < cov <= 50)
    at_50_80 = sum(1 for _, cov, _, _, _ in files if 50 < cov <= 80)
    at_80_95 = sum(1 for _, cov, _, _, _ in files if 80 < cov < 95)
    
    print(f"\nCoverage Breakdown:")
    print(f"  0% coverage:          {at_0}")
    print(f"  0-50% coverage:       {at_0_50}")
    print(f"  50-80% coverage:      {at_50_80}")
    print(f"  80-95% coverage:      {at_80_95}")

def main():
    """Main entry point."""
    directory_filter = None
    if len(sys.argv) > 1:
        if sys.argv[1] == '--directory' and len(sys.argv) > 2:
            directory_filter = sys.argv[2]
    
    try:
        data = load_coverage_data()
    except FileNotFoundError:
        print("Error: coverage/coverage-summary.json not found")
        print("Run: pnpm vitest run --coverage")
        sys.exit(1)
    
    files = get_files_below_threshold(data, 95)
    
    if directory_filter:
        files = [f for f in files if f[0].startswith(directory_filter)]
        title = f"Coverage Report - {directory_filter} (<95%)"
    else:
        title = "Coverage Report - All Files (<95%)"
    
    print_report(files, title)
    
    # Show some top files needing attention
    if files:
        print(f"\n{'=' * 100}")
        print("Top 10 Files Needing Attention (Lowest Coverage)")
        print(f"{'=' * 100}")
        for path, coverage, covered, total, uncovered in files[:10]:
            print(f"{path:<60} {coverage:>9.1f}%")

if __name__ == '__main__':
    main()
