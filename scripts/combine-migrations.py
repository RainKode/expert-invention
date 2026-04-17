"""
Sunday — Migration Combiner
Concatenates all SQL migration files into a single file for Supabase SQL Editor.

Usage: python scripts/combine-migrations.py
Output: supabase/combined-migration.sql
"""

import os

MIGRATIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "supabase", "migrations")
OUTPUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "supabase", "combined-migration.sql")

def combine():
    files = sorted([f for f in os.listdir(MIGRATIONS_DIR) if f.endswith(".sql")])
    print(f"Found {len(files)} migration files:")

    combined = []
    combined.append("-- Sunday — Combined Database Migration")
    combined.append("-- Auto-generated. Run this in Supabase Dashboard → SQL Editor")
    combined.append(f"-- Contains {len(files)} migrations\n")

    for f in files:
        path = os.path.join(MIGRATIONS_DIR, f)
        with open(path, "r", encoding="utf-8") as fh:
            sql = fh.read().strip()

        combined.append(f"\n-- ═══════════════════════════════════════════════")
        combined.append(f"-- Migration: {f}")
        combined.append(f"-- ═══════════════════════════════════════════════\n")
        combined.append(sql)
        combined.append("\n")
        print(f"  ✅ {f}")

    with open(OUTPUT, "w", encoding="utf-8") as out:
        out.write("\n".join(combined))

    print(f"\n✅ Combined migration written to: {OUTPUT}")
    print(f"   Paste this file's content into Supabase Dashboard → SQL Editor → Run")

if __name__ == "__main__":
    combine()
