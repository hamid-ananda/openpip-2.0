---
description: Run a parity test comparing 2.0 against legacy openpip.usask.ca.
---

Run a parity test that compares the new 2.0 stack against the live
legacy openPIP at openpip.usask.ca. Use this whenever a feature is
claimed Phase-1 complete.

The flow to test is given in `$ARGUMENTS`. Examples:
- "search BRCA1"
- "search by uniprot P38398"
- "fetch dataset HuRI"
- "export TP53 network as TSV"

Steps:

1. **Parse the flow** from `$ARGUMENTS`. If unclear, ask which flow
   to test before running anything.

2. **Hit legacy**:
   - GET https://openpip.usask.ca/<appropriate path>
   - Capture response body, status code, and any relevant headers.

3. **Hit 2.0**:
   - Determine the 2.0 base URL (from env or `docker compose ps`).
   - GET <2.0 URL>/<equivalent path>
   - Capture the same.

4. **Compare**:
   - Same status code? (If 2.0 returns different status, flag.)
   - Same result count? (Same number of proteins/interactions returned.)
   - Same identifiers? (Same gene names / UniProt IDs in the same order
     or as a set, depending on flow.)
   - Same scoring? (Numeric values within tolerance — exact match
     preferred, but document any divergence.)

5. **Output**:
   - "Parity OK" if results match.
   - "Parity DIVERGES" with a per-field diff if they don't.
   - For divergences, classify each as:
     (a) bug in 2.0 → must fix before Phase 1 done
     (b) bug in legacy → document, get mentor sign-off, fix in 2.0
     (c) intentional Phase 2 enhancement → must be tagged in code

Never modify code. This command only compares and reports.

Arguments: `$ARGUMENTS` — the flow description (e.g., "search BRCA1").
