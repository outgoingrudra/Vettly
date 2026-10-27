# Vettly

**AI-powered customizable interview and assessment platform**

Vettly is a platform concept for helping organizations create and
conduct structured candidate assessments, review evidence-backed
results, and compare candidates using consistent evaluation criteria.

> **Project status:** In planning / early development. Features and
> implementation details may change as requirements are validated.

## Goals

-   Give interviewers control over interview formats and proctoring
    settings.
-   Support multiple assessment types in one platform.
-   Make candidate evaluation more consistent, transparent, and
    reviewable.
-   Reduce repetitive work for recruiters while keeping hiring decisions
    under human control.
-   Build a reliable SaaS product that can start on free tiers and scale
    when real usage justifies investment.

## Planned Features

### Interview and assessment management

-   Create interviews and invite candidates.
-   Manage candidate progress and interview sessions.
-   Support coding assessments, MCQ tests, technical written questions,
    and live video interviews.

### Coding assessments

-   Provide a coding editor and test-case-based evaluation.
-   Apply server-side time and resource limits.
-   Use an external code-execution service initially, subject to its
    quotas and security capabilities.

### Configurable proctoring

Interviewers can choose which supported controls apply to each
assessment, such as: - Fullscreen-exit detection - Tab or
page-visibility change detection - Copy/paste event monitoring - Camera
availability and face-presence signals - Multiple-face and gaze-related
signals, where supported - Session interruption and integrity-event
logging

Browser-based monitoring cannot guarantee that cheating is impossible.
Signals may be inaccurate or have legitimate explanations, so they
should be presented as evidence for review---not automatic proof of
misconduct.

### Evaluation and reporting

-   Configurable scoring rubrics.
-   AI-assisted feedback and recommendations.
-   Reports that link scores to test results, candidate answers, rubric
    criteria, and relevant session events.
-   Candidate comparison using consistent criteria.
-   Recruiters retain responsibility for final hiring decisions.

### SaaS administration

-   Organization, admin, recruiter/interviewer, and candidate roles.
-   Tenant isolation and role-based access.
-   Audit logs and appropriate data-protection controls.
-   Dashboard for managing interviews, candidates, and results.

## Initial Technology Direction

The intended starting approach is cost-conscious and may include: -
**Backend:** Node.js and Express.js - **Frontend and hosting:** Vercel,
depending on framework and deployment requirements - **Database and
authentication:** A suitable provider with a free tier - **Live video:**
GetStream, subject to current plan limits and terms - **AI assistance:**
Gemini or another provider within available quotas - **Code execution:**
External execution API initially - **Version control and CI:** GitHub
and available free-tier tooling

These are provisional choices, not a final architecture. Provider
pricing, quotas, commercial-use terms, and production suitability must
be checked before launch. System design and database design will be
documented separately from the product requirements.

## Development Principles

-   Build incrementally and understand each component before integrating
    it.
-   Test edge cases, authorization boundaries, and failure behavior.
-   Keep secrets out of source control and validate all inputs on the
    server.
-   Use secure isolation for untrusted code execution; never execute
    candidate code directly in the main application process.
-   Measure performance and costs before adding infrastructure.
-   Treat AI output as fallible and make evaluations reviewable.
-   Protect candidate privacy, disclose monitoring, and provide
    appropriate human review.

## Planned Delivery

1.  Validate the target customers and their hiring workflow.
2.  Finalize the product requirements and acceptance criteria.
3.  Implement the core SaaS foundation and interview management.
4.  Build assessment workflows and secure code-execution integration.
5.  Add configurable proctoring and evidence-linked reporting.
6.  Pilot with a small number of organizations.
7.  Improve reliability, security, and capacity based on measured usage.

## Project Documentation

-   Product Requirements Document (PRD): planned
-   System Design Document: to be maintained separately
-   Database Design Document: to be maintained separately
-   Testing and QA Plan: planned

## Disclaimer

Vettly is intended to support hiring workflows, not to make unreviewable
automated hiring decisions. Proctoring signals and AI-generated
assessments should be interpreted in context and reviewed appropriately.

## License

No license has been selected yet. Until one is added, do not assume the
project is licensed for reuse or redistribution.
