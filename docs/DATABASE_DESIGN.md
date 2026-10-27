# Vettly --- Database Design

**Status:** Initial design baseline\
**Version:** 0.1\
**Database:** PostgreSQL (Neon is the initial candidate)\
**Related document:** `SYSTEM_DESIGN.md`

> This is the implementation baseline, not a claim that every table must
> be built in the MVP. Build in small migrations and implement only the
> tables needed by the current product slice. Revisit this design when
> the PRD, workflows, or measured production needs change.

## 1. Design goals

-   Support multiple companies (tenants) with strict data isolation.
-   Allow one user account to act as a recruiter/interviewer in one or
    more companies and as a candidate across companies.
-   Keep company-private candidate applications, assessment attempts,
    scores, notes, and reports separate.
-   Support reusable assessment templates while preserving an immutable
    snapshot of what a candidate actually received.
-   Store flexible question-specific settings without turning the entire
    schema into unvalidated JSON.
-   Make assessment submissions durable, auditable, and safe to retry.
-   Support pagination and bounded queries by default.
-   Keep billing provider integration optional until pricing and
    packaging are validated.

## 2. Core decisions

### 2.1 Tenant and identity model

-   `users.id` is the same UUID as the managed-auth provider's user ID
    (initially Supabase Auth is a candidate). Do not store passwords in
    Vettly's database.
-   A user can have multiple `organization_memberships`; a membership
    grants a company-specific role such as `owner`, `admin`,
    `recruiter`, or `interviewer`.
-   A user may also have a `candidate_profile`. Candidate identity is
    reusable, but each company's application and assessment records are
    company-scoped.
-   Every company-owned record should carry `organization_id` directly
    or be reachable only through a parent whose organization ownership
    is checked. For high-risk tables, include `organization_id` directly
    and enforce consistency with composite foreign keys where practical.
-   Never trust a client-supplied `organization_id` by itself. Derive
    authorized company context from the verified identity and
    membership, then enforce it in the service/data-access layer.
    Consider PostgreSQL Row-Level Security (RLS) as an additional
    defense after its operational behavior is tested.

### 2.2 Reusable templates and immutable assessment snapshots

Templates are editable reusable blueprints. Interviews/assessment
assignments must not depend on mutable template content after they are
created.

Recommended flow: 1. Recruiter creates or edits a template and its
questions/settings. 2. At publication/assignment time, Vettly copies the
selected question versions, order, scoring configuration, time limits,
and randomization policy into an interview snapshot. 3. The candidate's
actual selected question set/order is stored for that attempt. 4.
Template edits affect future interviews only, not already assigned or
completed work.

For auditability, record the source template/version and a snapshot
version. If questions have shared reusable versions, preserve those
versions rather than overwriting historical question content.

### 2.3 Randomization

Store a policy, not only a UI toggle: - `randomize_questions` boolean. -
Optional section-level rules and eligible question pools. - Preserve
required questions and constraints. - Persist the selected question IDs
and actual order per attempt at attempt creation. Do not re-randomize on
refresh or reconnect. - If option randomization is later added, store
the selected option order per attempt too. - Never randomize after the
candidate has started an attempt.

### 2.4 Billing recommendation

**Prepare for billing, but do not build a full billing system in the
MVP.**

-   Keep a stable `organization_id` as the billing tenant.
-   Do not hard-code feature access throughout the codebase; route it
    through a small entitlement/usage service.
-   When paid plans are validated, add `billing_accounts` and
    `subscriptions` that store provider identifiers and local status
    snapshots. The payment provider should remain the source of truth
    for invoices and payment collection.
-   Add usage events/counters only when the pricing model is known (for
    example, completed assessments, active seats, or interview minutes).
    Do not guess the billable unit now.
-   Do not store card numbers or sensitive payment credentials.
-   For the initial database, a nullable plan/tier label on the
    organization is optional; avoid a fake subscription table that has
    no real behavior. A small
    `organization_settings`/feature-entitlement boundary is enough until
    billing is real.

## 3. Logical entity map

``` mermaid
erDiagram
    USERS ||--o{ ORGANIZATION_MEMBERSHIPS : joins
    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERSHIPS : has
    USERS ||--o| CANDIDATE_PROFILES : may_have
    ORGANIZATIONS ||--o{ ASSESSMENT_TEMPLATES : owns
    ASSESSMENT_TEMPLATES ||--o{ TEMPLATE_VERSIONS : versions
    TEMPLATE_VERSIONS ||--o{ TEMPLATE_QUESTIONS : contains
    QUESTIONS ||--o{ TEMPLATE_QUESTIONS : reused_in
    ORGANIZATIONS ||--o{ INTERVIEWS : owns
    INTERVIEWS ||--o{ INTERVIEW_CANDIDATES : invites
    CANDIDATE_PROFILES ||--o{ INTERVIEW_CANDIDATES : receives
    INTERVIEWS ||--o{ INTERVIEW_QUESTION_SNAPSHOTS : snapshots
    INTERVIEW_CANDIDATES ||--o{ ASSESSMENT_ATTEMPTS : attempts
    ASSESSMENT_ATTEMPTS ||--o{ ANSWERS : contains
    ASSESSMENT_ATTEMPTS ||--o{ PROCTORING_EVENTS : records
    ASSESSMENT_ATTEMPTS ||--o| EVALUATION_REPORTS : evaluated_as
    INTERVIEWS ||--o{ AUDIT_LOGS : audited
```

This is a logical overview; implementation foreign keys and optional
relationships are specified below.

## 4. Naming and data conventions

-   Use `snake_case` for tables and columns; plural table names are
    preferred.
-   Use UUID primary keys (`gen_random_uuid()` where supported) for
    externally referenced records.
-   Use `timestamptz` for timestamps and store instants in UTC. Store
    the interview's intended IANA timezone (for example, `Asia/Kolkata`)
    alongside local scheduling intent where needed.
-   Use `created_at` and `updated_at` on mutable entities. Use
    `deleted_at` only where recoverability or soft deletion is a real
    requirement; do not soft-delete everything by default.
-   Use explicit status columns with constrained values (`CHECK`
    constraints or PostgreSQL enums). Prefer `CHECK` constraints for
    statuses likely to evolve frequently.
-   Use `numeric` for exact monetary values, never floating point; use
    an ISO currency code.
-   Use `jsonb` only for bounded, validated configuration or provider
    metadata---not as a replacement for relationships, permissions, or
    frequently queried fields.
-   Add foreign keys and `NOT NULL` constraints by default. Explain
    every intentional nullable column.
-   Do not store large binary files in PostgreSQL. Store object-storage
    keys and metadata in `files`.

## 5. Proposed tables

The schema below is a logical contract. Exact SQL types, enum/check
values, and migration order should be finalized in migrations.

### 5.1 Identity and tenancy

#### `users`

-   `id UUID PK` --- managed-auth provider user ID.
-   `display_name TEXT`
-   `email_normalized TEXT` --- optional if email is owned/read from the
    auth provider; do not treat a duplicated email as the identity key.
-   `created_at TIMESTAMPTZ NOT NULL`
-   `updated_at TIMESTAMPTZ NOT NULL`

Keep this table minimal. Sync only the profile fields the application
actually needs.

#### `organizations`

-   `id UUID PK`
-   `name TEXT NOT NULL`
-   `slug TEXT NOT NULL UNIQUE`
-   `status TEXT NOT NULL` --- e.g. active, suspended, closed.
-   `created_by_user_id UUID FK -> users.id`
-   `created_at`, `updated_at TIMESTAMPTZ NOT NULL`

The organization is the tenant and future billing boundary.

#### `organization_memberships`

-   `id UUID PK`
-   `organization_id UUID NOT NULL FK -> organizations.id`
-   `user_id UUID NOT NULL FK -> users.id`
-   `role TEXT NOT NULL` --- owner, admin, recruiter, interviewer.
-   `status TEXT NOT NULL` --- invited, active, suspended, removed.
-   `invited_by_user_id UUID FK -> users.id`
-   `created_at`, `updated_at TIMESTAMPTZ NOT NULL`
-   `UNIQUE (organization_id, user_id)`

Enforce role changes and membership removal through authorized service
operations and audit them. Avoid putting a single global `role` on
`users`; a person may have different roles in different companies.

#### `candidate_profiles`

-   `id UUID PK`
-   `user_id UUID NOT NULL UNIQUE FK -> users.id`
-   `display_name TEXT`
-   `phone TEXT` --- optional and only if needed.
-   `profile_data JSONB NOT NULL DEFAULT '{}'` --- limited
    candidate-controlled optional profile fields.
-   `created_at`, `updated_at TIMESTAMPTZ NOT NULL`

Candidate profile fields are global and should be minimal.
Company-specific notes, stage, status, and results belong in
company-scoped tables, not here.

#### `organization_candidate_records`

-   `id UUID PK`
-   `organization_id UUID NOT NULL FK -> organizations.id`
-   `candidate_profile_id UUID NOT NULL FK -> candidate_profiles.id`
-   `source TEXT` --- invited, self-applied, imported, referral.
-   `status TEXT NOT NULL` --- e.g. active, archived, withdrawn.
-   `created_at`, `updated_at TIMESTAMPTZ NOT NULL`
-   `UNIQUE (organization_id, candidate_profile_id)`

This represents the company's relationship with the reusable candidate
account. Keep company-specific recruiter notes and application status
here or in a separate `applications` table if multiple job applications
per candidate are required. Do not put a company's evaluation notes on
the global candidate profile.

#### `applications` (include if Vettly supports jobs/requisitions in MVP)

-   `id UUID PK`
-   `organization_id UUID NOT NULL FK -> organizations.id`
-   `candidate_profile_id UUID NOT NULL FK -> candidate_profiles.id`
-   `job_title TEXT` or `job_id UUID` if a `jobs` entity is introduced.
-   `status TEXT NOT NULL`
-   `created_at`, `updated_at TIMESTAMPTZ NOT NULL`

If Vettly does not model jobs in the MVP, defer this table and use
`organization_candidate_records` plus interview assignments. Do not
invent a full ATS schema before product scope requires it.

### 5.2 Questions and reusable templates

#### `questions`

-   `id UUID PK`
-   `organization_id UUID NULL FK -> organizations.id` --- NULL only for
    platform-wide shared questions; tenant-owned questions must have an
    organization.
-   `created_by_user_id UUID FK -> users.id`
-   `question_type TEXT NOT NULL` --- mcq, written, coding, or another
    supported type.
-   `title TEXT NOT NULL`
-   `prompt TEXT NOT NULL`
-   `difficulty TEXT` --- optional controlled value.
-   `content JSONB NOT NULL DEFAULT '{}'` --- validated type-specific
    settings that do not merit relational columns.
-   `status TEXT NOT NULL` --- draft, published, archived.
-   `created_at`, `updated_at TIMESTAMPTZ NOT NULL`

Avoid exposing hidden test cases, answer keys, or expected answers to
candidate-facing API responses. Consider separating confidential
evaluation data from candidate-visible question content or ensuring
strict field-level serialization.

#### `question_options`

-   `id UUID PK`
-   `question_id UUID NOT NULL FK -> questions.id`
-   `option_text TEXT NOT NULL`
-   `display_order INTEGER NOT NULL`
-   `is_correct BOOLEAN NOT NULL DEFAULT FALSE` --- accessible only to
    authorized evaluation code.
-   `UNIQUE (question_id, display_order)`

For MCQs, keep options relational so they can be validated and ordered.
Enforce that a question has the required number of correct answers in
application validation or a deferred validation workflow, since a simple
row constraint cannot validate sibling rows.

#### `question_versions` (recommended before templates are widely reused)

-   `id UUID PK`
-   `question_id UUID NOT NULL FK -> questions.id`
-   `version_number INTEGER NOT NULL`
-   `question_snapshot JSONB NOT NULL`
-   `created_by_user_id UUID FK -> users.id`
-   `created_at TIMESTAMPTZ NOT NULL`
-   `UNIQUE (question_id, version_number)`

Store a complete versioned question definition, including options and
scoring metadata, with clear rules about what candidate-facing and
evaluator-only fields it contains. Never mutate a version referenced by
a published template or interview snapshot.

#### `assessment_templates`

-   `id UUID PK`
-   `organization_id UUID NOT NULL FK -> organizations.id`
-   `created_by_user_id UUID NOT NULL FK -> users.id`
-   `name TEXT NOT NULL`
-   `description TEXT`
-   `status TEXT NOT NULL` --- draft, published, archived.
-   `current_version_number INTEGER`
-   `created_at`, `updated_at TIMESTAMPTZ NOT NULL`

#### `assessment_template_versions`

-   `id UUID PK`
-   `template_id UUID NOT NULL FK -> assessment_templates.id`
-   `version_number INTEGER NOT NULL`
-   `settings JSONB NOT NULL DEFAULT '{}'` --- time limit, allowed
    attempt policy, randomization policy, section rules, and other
    validated settings.
-   `rubric_snapshot JSONB NOT NULL DEFAULT '{}'`
-   `created_by_user_id UUID FK -> users.id`
-   `created_at TIMESTAMPTZ NOT NULL`
-   `UNIQUE (template_id, version_number)`

#### `assessment_template_version_questions`

-   `id UUID PK`
-   `template_version_id UUID NOT NULL FK -> assessment_template_versions.id`
-   `question_version_id UUID NOT NULL FK -> question_versions.id`
-   `section_key TEXT`
-   `display_order INTEGER NOT NULL`
-   `is_required BOOLEAN NOT NULL DEFAULT TRUE`
-   `points NUMERIC(8,2) NOT NULL DEFAULT 0`
-   `selection_group TEXT` --- optional group used for selecting N
    questions from a pool.
-   `UNIQUE (template_version_id, display_order)`

Use application validation to ensure a template's questions belong to
the same organization or are platform-shared. A published template
version should be immutable.

### 5.3 Interviews and candidate assignments

#### `interviews`

-   `id UUID PK`
-   `organization_id UUID NOT NULL FK -> organizations.id`
-   `created_by_user_id UUID NOT NULL FK -> users.id`
-   `template_version_id UUID NULL FK -> assessment_template_versions.id`
-   `title TEXT NOT NULL`
-   `status TEXT NOT NULL` --- draft, scheduled, active, completed,
    cancelled, archived.
-   `scheduled_start_at TIMESTAMPTZ`
-   `scheduled_end_at TIMESTAMPTZ`
-   `scheduled_timezone TEXT` --- IANA timezone.
-   `settings_snapshot JSONB NOT NULL DEFAULT '{}'` --- interview-level
    settings and policy snapshot.
-   `created_at`, `updated_at TIMESTAMPTZ NOT NULL`

An interview belongs to one organization at a time. Changing its
organization is a privileged operation: verify the destination
organization's authority, re-check all related resources and
invitations, record before/after ownership in the audit log, and prevent
accidental access by the old tenant. Prefer prohibiting transfer once
candidates have started or results exist unless a carefully defined
transfer workflow exists.

#### `interview_candidates`

-   `id UUID PK`
-   `organization_id UUID NOT NULL FK -> organizations.id`
-   `interview_id UUID NOT NULL FK -> interviews.id`
-   `candidate_profile_id UUID NOT NULL FK -> candidate_profiles.id`
-   `invited_by_user_id UUID FK -> users.id`
-   `invitation_email TEXT` --- email used to send the invitation; may
    differ from the account email.
-   `invitation_status TEXT NOT NULL` --- pending, sent, accepted,
    declined, expired, revoked.
-   `candidate_status TEXT NOT NULL` --- not_started, in_progress,
    submitted, reviewed, withdrawn.
-   `invitation_token_hash TEXT UNIQUE` --- store a hash, never a raw
    bearer token.
-   `invitation_expires_at TIMESTAMPTZ`
-   `invited_at`, `created_at`, `updated_at TIMESTAMPTZ NOT NULL`
-   `UNIQUE (interview_id, candidate_profile_id)`

Do not expose a candidate's participation in another company to the
current company. Invitation tokens must be random, time-limited,
single-use or safely idempotent, and revocable.

#### `interview_question_snapshots`

-   `id UUID PK`
-   `organization_id UUID NOT NULL FK -> organizations.id`
-   `interview_id UUID NOT NULL FK -> interviews.id`
-   `source_question_version_id UUID NULL FK -> question_versions.id`
-   `question_snapshot JSONB NOT NULL`
-   `display_order INTEGER NOT NULL`
-   `section_key TEXT`
-   `is_required BOOLEAN NOT NULL`
-   `points NUMERIC(8,2) NOT NULL DEFAULT 0`
-   `created_at TIMESTAMPTZ NOT NULL`
-   `UNIQUE (interview_id, display_order)`

This preserves the exact question content/settings used by the interview
even if a source question or template later changes. Never include
evaluator-only fields in candidate responses.

#### `interview_sessions` (for live/video interview metadata)

-   `id UUID PK`
-   `organization_id UUID NOT NULL FK -> organizations.id`
-   `interview_candidate_id UUID NOT NULL FK -> interview_candidates.id`
-   `provider TEXT NOT NULL` --- initially GetStream.
-   `provider_session_id TEXT`
-   `status TEXT NOT NULL`
-   `started_at`, `ended_at TIMESTAMPTZ`
-   `metadata JSONB NOT NULL DEFAULT '{}'`
-   `created_at TIMESTAMPTZ NOT NULL`

Store provider identifiers and session metadata, not video/audio
binaries.

### 5.4 Assessment attempts, answers, and code execution

#### `assessment_attempts`

-   `id UUID PK`
-   `organization_id UUID NOT NULL FK -> organizations.id`
-   `interview_candidate_id UUID NOT NULL FK -> interview_candidates.id`
-   `attempt_number INTEGER NOT NULL`
-   `status TEXT NOT NULL` --- not_started, in_progress, submitted,
    expired, invalidated.
-   `started_at TIMESTAMPTZ`
-   `deadline_at TIMESTAMPTZ`
-   `submitted_at TIMESTAMPTZ`
-   `finalized_at TIMESTAMPTZ`
-   `question_order JSONB NOT NULL DEFAULT '[]'` --- ordered snapshot
    question IDs selected for this attempt.
-   `settings_snapshot JSONB NOT NULL DEFAULT '{}'`
-   `version INTEGER NOT NULL DEFAULT 1` --- optimistic
    concurrency/version checks.
-   `created_at`, `updated_at TIMESTAMPTZ NOT NULL`
-   `UNIQUE (interview_candidate_id, attempt_number)`

The server is authoritative for timing and finalization. Make submission
idempotent; reject stale updates using `version` or equivalent
concurrency control. Persist the chosen randomized order once and reuse
it on reconnect.

#### `answers`

-   `id UUID PK`
-   `organization_id UUID NOT NULL FK -> organizations.id`
-   `attempt_id UUID NOT NULL FK -> assessment_attempts.id`
-   `interview_question_snapshot_id UUID NOT NULL FK -> interview_question_snapshots.id`
-   `answer_type TEXT NOT NULL`
-   `answer_text TEXT` --- written response or source code when within
    defined size limits.
-   `selected_option_ids JSONB` --- selected MCQ option IDs in
    candidate-visible snapshot context.
-   `answer_payload JSONB NOT NULL DEFAULT '{}'` --- bounded validated
    type-specific data.
-   `status TEXT NOT NULL` --- draft, saved, submitted, evaluated.
-   `version INTEGER NOT NULL DEFAULT 1`
-   `last_saved_at TIMESTAMPTZ`
-   `submitted_at TIMESTAMPTZ`
-   `created_at`, `updated_at TIMESTAMPTZ NOT NULL`
-   `UNIQUE (attempt_id, interview_question_snapshot_id)`

For large code submissions, consider a separate `code_submissions` table
with immutable submission versions. Enforce answer size limits and never
allow a candidate to alter a finalized answer without creating an
explicit revision/audit event.

#### `code_submissions` (add when coding assessments are implemented)

-   `id UUID PK`
-   `organization_id UUID NOT NULL FK -> organizations.id`
-   `answer_id UUID NOT NULL FK -> answers.id`
-   `submission_number INTEGER NOT NULL`
-   `language TEXT NOT NULL`
-   `source_code TEXT NOT NULL`
-   `status TEXT NOT NULL` --- queued, running, completed, failed,
    timed_out.
-   `created_at TIMESTAMPTZ NOT NULL`
-   `UNIQUE (answer_id, submission_number)`

#### `code_execution_runs` (add when the code runner is implemented)

-   `id UUID PK`
-   `organization_id UUID NOT NULL FK -> organizations.id`
-   `code_submission_id UUID NOT NULL FK -> code_submissions.id`
-   `status TEXT NOT NULL`
-   `runtime_ms INTEGER`
-   `memory_kb INTEGER`
-   `test_summary JSONB NOT NULL DEFAULT '{}'`
-   `runner_reference TEXT` --- opaque runner/job identifier.
-   `started_at`, `finished_at TIMESTAMPTZ`
-   `created_at TIMESTAMPTZ NOT NULL`

Store bounded result summaries, not unbounded stdout/stderr or arbitrary
runner output. Store full logs in a controlled log/object-storage system
only if necessary. Never execute untrusted code in the API process.

### 5.5 Proctoring, evaluation, and review

#### `proctoring_events`

-   `id UUID PK`
-   `organization_id UUID NOT NULL FK -> organizations.id`
-   `attempt_id UUID NOT NULL FK -> assessment_attempts.id`
-   `event_type TEXT NOT NULL` --- e.g. fullscreen_exit,
    visibility_change, clipboard_action, face_missing, multiple_faces.
-   `occurred_at TIMESTAMPTZ NOT NULL`
-   `severity TEXT NOT NULL` --- informational, low, medium, high.
-   `details JSONB NOT NULL DEFAULT '{}'` --- bounded, validated event
    metadata; avoid unnecessary biometric data.
-   `review_status TEXT NOT NULL DEFAULT 'unreviewed'`
-   `reviewed_by_user_id UUID FK -> users.id`
-   `reviewed_at TIMESTAMPTZ`
-   `created_at TIMESTAMPTZ NOT NULL`

These events are signals, not proof of cheating. Define retention
separately for event metadata, images, and recordings. Do not store raw
camera/microphone streams in this table.

#### `evaluation_reports`

-   `id UUID PK`
-   `organization_id UUID NOT NULL FK -> organizations.id`
-   `attempt_id UUID NOT NULL UNIQUE FK -> assessment_attempts.id`
-   `status TEXT NOT NULL` --- queued, processing, completed, failed,
    needs_review.
-   `overall_score NUMERIC(6,2)`
-   `max_score NUMERIC(6,2)`
-   `summary TEXT`
-   `model_provider TEXT`
-   `model_name TEXT`
-   `prompt_version TEXT`
-   `rubric_version TEXT`
-   `evidence JSONB NOT NULL DEFAULT '[]'` --- references to answers,
    test outcomes, and rubric criteria.
-   `generated_at TIMESTAMPTZ`
-   `reviewed_by_user_id UUID FK -> users.id`
-   `reviewed_at TIMESTAMPTZ`
-   `created_at`, `updated_at TIMESTAMPTZ NOT NULL`

Treat AI output as a recommendation. Validate its schema and score
bounds; preserve model/prompt/rubric versions and evidence. Human
reviewers make final hiring decisions.

#### `evaluation_criterion_scores`

-   `id UUID PK`
-   `organization_id UUID NOT NULL FK -> organizations.id`
-   `evaluation_report_id UUID NOT NULL FK -> evaluation_reports.id`
-   `criterion_key TEXT NOT NULL`
-   `criterion_label TEXT NOT NULL`
-   `score NUMERIC(6,2) NOT NULL`
-   `max_score NUMERIC(6,2) NOT NULL`
-   `rationale TEXT`
-   `evidence_refs JSONB NOT NULL DEFAULT '[]'`
-   `created_at TIMESTAMPTZ NOT NULL`
-   `UNIQUE (evaluation_report_id, criterion_key)`

#### `review_notes` (add when recruiter review workflow is implemented)

-   `id UUID PK`
-   `organization_id UUID NOT NULL FK -> organizations.id`
-   `interview_candidate_id UUID NOT NULL FK -> interview_candidates.id`
-   `author_user_id UUID NOT NULL FK -> users.id`
-   `body TEXT NOT NULL`
-   `visibility TEXT NOT NULL` --- company_internal or explicitly
    shared.
-   `created_at`, `updated_at TIMESTAMPTZ NOT NULL`

Candidate-visible feedback must be explicit. Internal notes and AI
reports are not exposed by default.

### 5.6 Files, audit, and asynchronous operations

#### `files`

-   `id UUID PK`
-   `organization_id UUID NULL FK -> organizations.id` --- NULL only for
    explicitly global assets.
-   `uploaded_by_user_id UUID FK -> users.id`
-   `candidate_profile_id UUID NULL FK -> candidate_profiles.id`
-   `storage_provider TEXT NOT NULL` --- initially Backblaze B2 or
    another private object store.
-   `object_key TEXT NOT NULL`
-   `original_filename TEXT`
-   `content_type TEXT`
-   `size_bytes BIGINT NOT NULL`
-   `purpose TEXT NOT NULL` --- resume, attachment, export, recording,
    etc.
-   `status TEXT NOT NULL` --- pending, available, quarantined, deleted.
-   `retention_until TIMESTAMPTZ`
-   `created_at`, `deleted_at TIMESTAMPTZ`
-   `UNIQUE (storage_provider, object_key)`

Use private buckets, short-lived signed URLs, file size/type validation,
malware scanning where appropriate, and ownership checks. Do not store
public permanent URLs for private candidate files.

#### `audit_logs`

-   `id UUID PK`
-   `organization_id UUID NULL FK -> organizations.id` --- NULL for
    platform-level events only.
-   `actor_user_id UUID NULL FK -> users.id`
-   `action TEXT NOT NULL`
-   `resource_type TEXT NOT NULL`
-   `resource_id UUID`
-   `occurred_at TIMESTAMPTZ NOT NULL`
-   `request_id TEXT`
-   `ip_hash TEXT` --- only if justified by the privacy/security policy;
    avoid retaining raw IP by default.
-   `metadata JSONB NOT NULL DEFAULT '{}'` --- allowlisted before/after
    fields; never store tokens, secrets, full answers, or sensitive
    payloads.
-   `created_at TIMESTAMPTZ NOT NULL`

Treat audit rows as append-only. Restrict write/read access. Define
retention and export controls.

#### `email_delivery_records` (optional; use if delivery status/idempotency needs to be queryable)

-   `id UUID PK`
-   `organization_id UUID NULL FK -> organizations.id`
-   `deduplication_key TEXT NOT NULL UNIQUE`
-   `provider_message_id TEXT`
-   `template_key TEXT NOT NULL`
-   `status TEXT NOT NULL` --- queued, sent, delivered, bounced, failed.
-   `attempt_count INTEGER NOT NULL DEFAULT 0`
-   `last_error_code TEXT`
-   `created_at`, `updated_at TIMESTAMPTZ NOT NULL`

The RabbitMQ queue is not replaced by this table. This table tracks
delivery status and deduplication. Keep email content and personal data
out of logs where possible.

#### `organization_settings` (optional)

-   `organization_id UUID PK FK -> organizations.id`
-   `settings JSONB NOT NULL DEFAULT '{}'`
-   `updated_by_user_id UUID FK -> users.id`
-   `updated_at TIMESTAMPTZ NOT NULL`

Validate settings against an application schema; do not use this table
for access-control rules or high-volume query filters.

## 6. Relationships and integrity rules

Implement and test these invariants:

1.  Every company-owned record is scoped to exactly one organization.
2.  A membership role is valid only for its organization; no global
    recruiter/admin role on `users`.
3.  An interview's `organization_id` must match the organization of its
    creator's active membership and its selected template version.
4.  An `interview_candidate` must reference an interview in the same
    organization. The candidate identity itself remains global.
5.  An attempt, answer, code submission, code execution run, proctoring
    event, report, and review note must match the organization of their
    parent record.
6.  A template version and question version become immutable when
    published/referenced by an interview snapshot.
7.  An answer can only reference a question snapshot included in that
    attempt's interview.
8.  The same candidate should not receive duplicate assignments for the
    same interview unless a deliberate retry/reassignment policy allows
    it.
9.  Submission/finalization must be atomic and idempotent.
10. Deleting a user must not silently destroy audit history or completed
    assessment records. Define anonymization and retention rules
    separately.
11. Cross-tenant foreign-key consistency should be enforced with
    composite foreign keys where practical, or by a single well-tested
    data-access boundary with equivalent tests.
12. Enforce ownership checks for files and provider sessions on every
    access, not just on upload or creation.

## 7. Indexing and query patterns

Create indexes to support actual filters and sorting. Review with
`EXPLAIN (ANALYZE, BUFFERS)` using representative data before adding
speculative indexes.

Recommended starting indexes:

  ----------------------------------------------------------------------------------------------------------
  Table                               Index
  ----------------------------------- ----------------------------------------------------------------------
  `organization_memberships`          unique `(organization_id, user_id)`; `(user_id, status)` for
                                      membership lookup

  `interviews`                        `(organization_id, status, scheduled_start_at DESC, id DESC)`

  `interview_candidates`              unique `(interview_id, candidate_profile_id)`;
                                      `(organization_id, candidate_profile_id, created_at DESC, id DESC)`;
                                      `(organization_id, invitation_status, created_at DESC, id DESC)`

  `assessment_templates`              `(organization_id, status, updated_at DESC, id DESC)`

  `assessment_template_versions`      unique `(template_id, version_number)`

  `assessment_attempts`               unique `(interview_candidate_id, attempt_number)`;
                                      `(organization_id, status, updated_at DESC, id DESC)`

  `answers`                           unique `(attempt_id, interview_question_snapshot_id)`

  `code_submissions`                  unique `(answer_id, submission_number)`

  `proctoring_events`                 `(organization_id, attempt_id, occurred_at DESC, id DESC)`

  `evaluation_reports`                `(organization_id, status, created_at DESC, id DESC)`

  `files`                             `(organization_id, purpose, created_at DESC, id DESC)`; unique
                                      `(storage_provider, object_key)`

  `audit_logs`                        `(organization_id, occurred_at DESC, id DESC)`;
                                      `(resource_type, resource_id, occurred_at DESC)`
  ----------------------------------------------------------------------------------------------------------

Add indexes on foreign-key columns used in joins and deletes when
PostgreSQL does not already have a suitable index. Avoid indexes on
every JSONB field. Add a GIN or expression index only for a demonstrated
query.

## 8. Pagination and query limits

-   Paginate all list endpoints by default. Never return an unbounded
    collection.
-   Prefer cursor/keyset pagination for large or frequently changing
    lists. Use a deterministic sort such as `(created_at DESC, id DESC)`
    and an index that matches it.
-   Cap page size (for example, 100 maximum); choose the default and
    maximum in API configuration.
-   Use offset pagination only for small collections where page-number
    UX is needed and performance is acceptable.
-   Enforce tenant filters in the database query, not by fetching all
    rows and filtering in application memory.
-   Bound filters, date ranges, search length, joins, request bodies,
    and response sizes.
-   Test cursor behavior when rows are inserted/deleted during
    pagination and verify users cannot paginate into another tenant's
    records.

## 9. Transactions and concurrency

Use a database transaction for operations that must succeed or fail
together:

-   Create an interview and its immutable question/settings snapshots.
-   Accept an invitation and create the candidate's assignment/attempt
    state.
-   Finalize an attempt and lock its submitted answers.
-   Record a code submission and enqueue its execution job using a
    transactional outbox or another reliable publish pattern.
-   Record an evaluation result and its criterion scores.
-   Transfer an interview between organizations, if transfer is
    permitted at all.

For RabbitMQ integration, do not assume a database commit and message
publish are one atomic operation. Use a transactional outbox for
critical jobs: write the domain change and outbox row in one
transaction, then a publisher sends the message and marks it delivered.
Consumers must be idempotent.

Use optimistic concurrency (`version`) for autosave/answer updates, and
idempotency keys for retryable create/submit operations.

## 10. Security, privacy, and retention

-   Authentication is handled by the selected auth provider;
    authorization is enforced by the Vettly API for every request.
-   Use parameterized SQL and a query builder/ORM consistently. Never
    build SQL from untrusted strings.
-   Use least-privilege database roles; migrations should use a separate
    privileged role from the runtime API role.
-   Never expose hidden MCQ answers, coding test cases, evaluation-only
    content, internal notes, or other companies' records to candidates.
-   Apply field-level serialization rules for candidate versus
    recruiter/admin views.
-   Keep candidate identity reusable but tenant-specific applications,
    notes, results, and proctoring records private to the relevant
    company.
-   Define separate retention periods for resumes, answer/code data,
    proctoring metadata, recordings, reports, audit logs, and delivery
    records before production. Delete/anonymize by policy and contract;
    legal holds may override routine deletion where applicable.
-   Avoid storing biometric templates or raw video/audio in PostgreSQL.
    If recordings are introduced, use provider/object storage with
    explicit access and retention policies.
-   Proctoring events are imperfect signals, not proof of misconduct.
    Keep review outcomes distinct from raw events.
-   Backups must be encrypted and restoration tested. A backup is not a
    retention/deletion strategy; deletion policy must account for backup
    expiry.

## 11. Migration and deployment policy

-   Use versioned migrations committed to the repository; never edit
    production schema manually as the normal workflow.
-   Run migrations in CI against a disposable PostgreSQL database.
-   Use expand-and-contract migrations for changes that must work with
    old and new app versions during deployment.
-   Avoid destructive schema changes in the same release that stops
    writing the old field.
-   Seed only non-production demo/test data. Never seed real candidate
    data or secrets.
-   Keep production migration credentials out of the runtime API
    environment.
-   Track migration status and test rollback/recovery procedures; not
    every data migration is safely reversible, so document
    forward-repair plans too.
-   Test backup restoration and verify constraints/indexes after
    significant migrations.

## 12. Suggested MVP implementation order

### Build first

1.  `users`, `organizations`, `organization_memberships`
2.  `candidate_profiles`, `organization_candidate_records`
3.  `questions`, `question_options`, `assessment_templates`,
    `assessment_template_versions`,
    `assessment_template_version_questions`
4.  `interviews`, `interview_candidates`, `interview_question_snapshots`
5.  `assessment_attempts`, `answers`
6.  `audit_logs`, minimal `files` metadata if uploads are in the first
    release

### Add when those features are implemented

-   `question_versions` if question reuse/versioning is required early;
    otherwise make a deliberate versioned-question strategy before
    publishing templates.
-   `code_submissions`, `code_execution_runs` when coding assessment is
    implemented.
-   `proctoring_events` when proctoring is implemented.
-   `evaluation_reports`, `evaluation_criterion_scores` when AI/rubric
    evaluation is implemented.
-   `interview_sessions` when live video interviews are implemented.
-   `email_delivery_records` when delivery tracking/idempotency requires
    durable database state.
-   `applications` and `jobs` only if job/requisition workflows are in
    product scope.
-   Billing tables only after the pricing model and payment provider are
    chosen.

## 13. Decisions to revisit

Revisit this document when: - PRD clarifies whether jobs/applications
are first-class entities. - Product supports multiple attempts, retakes,
candidate rescheduling, or reusable candidate pools. - The assessment
editor adds complex sections, adaptive question selection, or randomized
options. - Billing model and provider are chosen. - Production query
plans show a need for partitioning, materialized views, caching, or read
replicas. - Data volume/retention requires partitioning or archival for
audit/proctoring events. - Tenant-isolation testing demonstrates that
RLS is beneficial and can be maintained safely.

## 14. Definition of done for database work

-   Every table has a documented purpose, ownership boundary, and
    retention expectation.
-   Foreign keys, unique constraints, `NOT NULL`, and status validation
    are present where appropriate.
-   Tenant isolation is tested with at least two organizations and users
    with different memberships.
-   Candidate account reuse across companies is tested without leaking
    cross-company data.
-   Template edits do not alter existing interview snapshots or
    completed attempts.
-   Randomized question order persists across refresh/reconnect.
-   Submission and queue publishing are safe under retries and partial
    failures.
-   Pagination is bounded, deterministic, indexed, and tested under
    concurrent changes.
-   Migrations run from a clean database in CI.
-   Backup/restore, deletion/anonymization, and incident procedures are
    defined before production.

## 15. Working rule for AI-assisted implementation

Before creating or changing a table, migration, or query: 1. Read
`SYSTEM_DESIGN.md` and this document. 2. State which product requirement
the change supports. 3. Check tenant ownership, authorization,
constraints, indexes, and retention implications. 4. Implement the
smallest migration and add tests for success, failure, retries, and
cross-tenant access. 5. Update this document if the schema or an
architectural decision changes.

Do not silently deviate from the documented schema. If a change is
necessary, explain the reason and trade-off, update the document, then
implement it.


## 17. Account security, session visibility, and logout controls

This section supplements the earlier identity and security sections and is required if Vettly promises users control over where they are signed in.

### User-facing security features

The Account Security page should support:
- Listing sessions/devices where the authentication provider exposes reliable session data.
- Showing sign-in time and last activity where available, plus a best-effort browser/OS/device summary.
- Showing approximate location only if collected and justified; never imply it is precise. Device labels and user-agent strings can be spoofed.
- Logging out the current session, logging out other sessions, and logging out everywhere, according to provider capabilities.
- Reviewing recent account-security events: successful/failed sign-in when available, sign-out, password/email changes, MFA changes, account recovery, and session revocation.
- Verified email changes, secure password reset/recovery, optional MFA, and reauthentication for sensitive actions.
- Security notifications for important account changes where supported.

### Source of truth

The authentication provider owns credentials, refresh tokens, MFA secrets, and actual session validity. Never store passwords, access tokens, refresh tokens, password-reset tokens, recovery codes, or MFA secrets in Vettly application tables.

If Supabase Auth is selected, use its supported session and sign-out APIs and its session registry only through trusted server-side access where permitted. Never let the browser query privileged auth tables. A Vettly-owned session table can enrich the UI, but it is only a metadata mirror—not proof that a provider session remains active. If the provider does not offer reliable per-session listing/revocation for the chosen plan/API, document the limitation and expose only controls that can actually be guaranteed.

Important behavior: revoking refresh tokens may not instantly invalidate an already-issued JWT access token. Use sensible short-lived access tokens, provider-supported revocation, and session-validity checks for particularly sensitive operations where justified. Do not claim immediate logout from every API request unless the architecture enforces it.

### `auth_session_registry` (optional metadata mirror)

- `id UUID PK`
- `user_id UUID NOT NULL FK -> users.id`
- `provider TEXT NOT NULL`
- `provider_session_id TEXT NOT NULL`
- `device_label TEXT` — optional user-editable label.
- `user_agent_summary TEXT` — parsed, bounded browser/OS/device summary; avoid retaining an unbounded raw header.
- `approximate_location TEXT` — optional coarse region, only if justified.
- `created_at TIMESTAMPTZ NOT NULL`
- `last_seen_at TIMESTAMPTZ`
- `provider_expires_at TIMESTAMPTZ`
- `revocation_requested_at TIMESTAMPTZ`
- `revocation_confirmed_at TIMESTAMPTZ`
- `metadata_updated_at TIMESTAMPTZ NOT NULL`
- `UNIQUE (provider, provider_session_id)`

Do not mark a session as revoked just because a local row was updated. Call the provider's supported revocation mechanism and record the outcome. Reconcile stale metadata against provider state when possible. Never store session tokens in this table.

### `user_security_events`

- `id UUID PK`
- `user_id UUID NULL FK -> users.id` — nullable when an event cannot be confidently linked to an account.
- `event_type TEXT NOT NULL` — e.g. sign_in_succeeded, sign_in_failed, sign_out, session_revocation_requested, session_revoked, password_changed, email_changed, mfa_enabled, mfa_disabled, recovery_completed.
- `occurred_at TIMESTAMPTZ NOT NULL`
- `provider TEXT`
- `provider_session_id TEXT` — identifier only, never a token.
- `result TEXT NOT NULL` — success, denied, failed, pending.
- `approximate_location TEXT` — optional coarse region.
- `user_agent_summary TEXT`
- `details JSONB NOT NULL DEFAULT '{}'` — strict allowlist; never store credentials, tokens, recovery codes, or raw request bodies.
- `created_at TIMESTAMPTZ NOT NULL`

Do not retain raw IP addresses by default. If security needs justify collecting IP data, document access controls and retention explicitly; prefer minimizing or protecting it. Keep security events append-only for normal application roles and define a retention period. Protect and rate-limit event ingestion because failed sign-ins can be high volume. Public login and recovery responses must not reveal whether an email address has an account.

### Session-management indexes and tests

- `auth_session_registry`: unique `(provider, provider_session_id)` and `(user_id, last_seen_at DESC)`.
- `user_security_events`: `(user_id, occurred_at DESC, id DESC)` and `(event_type, occurred_at DESC, id DESC)`.

Test logout-current, logout-other, logout-all, stale-session display, provider errors, refresh-token revocation, and the remaining lifetime of previously issued access tokens. Test that one user cannot view or revoke another user's sessions. Security-event records must never contain tokens, passwords, recovery secrets, MFA secrets, or complete authentication payloads.

## 18. Additional security references

Reviewed on 2026-10-22; provider features and plan availability can change.

- [Supabase Auth — User sessions](https://supabase.com/docs/guides/auth/sessions): session model, session IDs, access-token lifetime, inactivity and maximum-lifetime settings, and plan-dependent controls.
- [Supabase Auth — Signing out](https://supabase.com/docs/guides/auth/signout): local, global, and other-session sign-out scopes; refresh-token revocation does not instantly invalidate an already-issued access JWT.
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html): server-side expiration, termination, reauthentication after risk events, and safe session logging.
- [OWASP Multifactor Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html): MFA and secure recovery guidance.

These references inform the design; they do not replace testing the selected provider's current API behavior, plan limits, and configuration before implementation.
