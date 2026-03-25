# Phase 6 Evaluations And Evidence Packaging

Phase 6 adds measurement and inspectability.

## Added

- in-repo eval dataset with golden expectations
- scorer that validates current workflow outputs against those expectations
- API endpoint exposing eval summaries
- evidence package artifact for document-summary outputs

## Why It Matters

The platform can now answer two operational questions:

1. Are the current workflows still producing the expected shape of results?
2. What evidence supports the returned summary?

This is still mock-mode, but it creates the right interfaces for real citations and CI enforcement later.
