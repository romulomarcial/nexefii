```markdown
# VALIDATION_REPORT
Generated: 2025-11-12T12:46:05.3900391-05:00

- File: migrations/V001__init.sql
  - Exists: True
  - Lines: 160
  - OK: True
  - Checks:
    - tenants_table: True
    - partition_clause: True

- File: migrations/V002__seed.sql
  - Exists: True
  - Lines: 49
  - OK: True
  - Checks:
    - modules_seed: True
    - demo_tenant_seed: True

- File: migrations/V003__demo.sql
  - Exists: True
  - Lines: 28
  - OK: True
  - Checks:
    - ensure_tenant_schema: True
    - tenant_tables_created: True

- File: nexefii-database-blueprint.md
  - Exists: True
  - Lines: 127
  - OK: True
  - Checks:
    - contains_ERD: True

- File: qa/schema-lint.ps1
  - Exists: True
  - Lines: 43
  - OK: True
  - Checks:
    - psql_checks: True

- File: qa/erd-export-note.md
  - Exists: True
  - Lines: 85
  - OK: True
  - Checks:
    - contains_ERD: True

ALL CHECKS: OK

```
