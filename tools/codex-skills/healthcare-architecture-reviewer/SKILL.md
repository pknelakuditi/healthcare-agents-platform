---
name: healthcare-architecture-reviewer
description: Review architecture or code changes in a healthcare-oriented system for PHI boundary mistakes, unsafe write paths, missing approval gates, weak auditability, policy leakage into prompts, and integration boundary violations. Use when maintaining healthcare agent systems or reviewing risky design changes.
---

# Healthcare Architecture Reviewer

Use this skill for maintenance or review work on healthcare platforms where safety, auditability, and controlled side effects matter more than generic code quality alone.

## Review Focus

Prioritize these questions:
- Can PHI cross the wrong boundary?
- Can a write happen without the intended approval or policy gate?
- Is business or safety policy enforced only in prompts instead of code?
- Are audit trails complete enough to reconstruct who requested, approved, executed, and observed the action?
- Do adapters and tools preserve clean boundaries around EHR, FHIR, documents, messaging, or claims systems?
- Does the change weaken replay protection, authn/authz, perimeter controls, or deployment assumptions?

## Review Workflow

1. Establish the flow.
Map request entry, policy evaluation, orchestration, tool execution, persistence, and audit emission.

2. Check healthcare-specific safety controls.
Look for:
- PHI gating errors
- direct write paths to external systems
- bypasses around human review
- incomplete actor attribution
- insufficient audit detail
- missing evidence or citation packaging where expected
- unsafe defaults in production config

3. Review integration boundaries.
Prefer typed tools and adapter layers. Flag logic that leaks vendor-specific behavior into orchestration or prompts.

4. Review negative paths.
The absence of a denial path is often the bug. Check unauthorized, expired, replayed, malformed, or out-of-policy requests.

5. Call out missing tests that protect safety properties.

## Output Format

Findings first, ordered by severity.
For each finding include:
- severity
- file and line reference when available
- the healthcare or operational risk
- the triggering scenario

After findings, optionally include:
- open questions or assumptions
- residual safety gaps

## Review Rules

- Prefer concrete safety findings over generic architecture commentary.
- Raise the bar for changes touching PHI, approvals, EHR writes, patient messaging, coding, scheduling, or auth.
- If the change looks acceptable, state that explicitly and mention the remaining operational risks.
