# engine/narrative Specification

## Purpose
Enriches an algorithmically computed report with AI-generated narrative copy by sending the structured report data to the Anthropic API and returning a validated JSON object containing question-set-agnostic player-facing text.

## Requirements

### Requirement: Algorithmic report as input

The AI narrative generator SHALL accept the `ReportData` produced by the existing `lib/scoring/` engine as its primary input. It SHALL NOT re-derive scores or gaps — it uses what the algorithmic engine already computed.

#### Scenario: Input is existing report data
- **WHEN** the narrative generator is called
- **THEN** it receives the full `ReportData` object (belief gaps, cluster scores, surprise factors, question gaps) and both player names

### Requirement: JSON-only output enforcement

The system SHALL instruct the model to return a raw JSON object with no surrounding markdown, no preamble, and no trailing text. The first character of the model response SHALL be `{` and the last SHALL be `}`.

#### Scenario: Markdown fence stripping
- **WHEN** the model response is wrapped in a ` ```json ` fence despite the instruction
- **THEN** the system strips the fence before parsing and does not throw

#### Scenario: Parse failure
- **WHEN** `JSON.parse` throws on the model response
- **THEN** the system returns `null` rather than propagating the error to the caller

### Requirement: Tone compliance

The system SHALL include a non-negotiable tone directive: warm, direct, and peer-to-peer regardless of alignment scores. Low alignment SHALL NOT change the voice. The narrative SHALL NOT sound like a therapist, a judge, or a crisis counselor.

#### Scenario: Low alignment score
- **WHEN** the report's `belief_gap` is above 3.5
- **THEN** the generated narrative uses the same direct, warm tone as a low-gap report

### Requirement: Evidence and specificity rules

The narrative SHALL NOT infer a stable personality trait from a single question. Every narrative section SHALL reference at least two specific questions. The AI output SHALL include an `evidence_questions` array and a `confidence` field (`"pattern"` for two or more questions, `"single_question"` for one) for each major claim.

#### Scenario: Multi-question pattern
- **WHEN** a narrative section describes a behavioral tendency
- **THEN** `evidence_questions` contains at least two question numbers and `confidence` is `"pattern"`

### Requirement: API key security

The Anthropic API key SHALL be read from `ANTHROPIC_API_KEY` server-side. It SHALL NOT be exposed to the client in any response body, error message, or log.

#### Scenario: Missing API key
- **WHEN** `ANTHROPIC_API_KEY` is not set in the server environment
- **THEN** the generator returns `null` and the caller falls back to the algorithmic report without leaking the missing key

### Requirement: Caller fallback contract

The narrative generator SHALL return `null` on any failure (network error, parse error, missing API key). Callers SHALL treat a `null` return as "use the algorithmic report as-is" and SHALL NOT surface the failure to the end user as an error.

#### Scenario: Graceful degradation
- **WHEN** the narrative generator returns null
- **THEN** the report stored and returned to the client contains the algorithmically computed data only, with no error state visible to the player
