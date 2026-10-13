# Workspace Layout & Deliverables Guide

Keep the applicant's workspace human-readable, transparent, and easy to inspect in any file explorer or editor.

## 1. Case Directory Layout

Store each case in its own folder under `cases/` (which is git-ignored) or any private path the user specifies:

```text
cases/<case-name>/
  materials/                          # Raw user files (read-only; never overwrite)
  work/                               # Working notes, active benchmark research & traceability
    evidence-index.md                 # Complete inventory of materials + extracted facts & page pinpoints
    benchmarks-and-citations.md       # Agent-researched citation context, venue metrics, wage data & rankings
    case-strategy.md                  # Category selection, case theory, criterion/prong mapping & open questions
  final/                              # Polished, applicant-facing deliverables
    00-assessment.md                  # Honest evaluation, strengths, vulnerabilities & evidence gap plan
    01-petition-letter.md             # Full I-140 Petition Letter / Legal Brief (.md + .docx/.pdf/.tex on request)
    02-personal-statement.md          # Petitioner's signed Statement of Future Work / Proposed Endeavor
    03-recommendation-letters/        # Recommender portfolio plan & distinct, non-templated letter drafts
    04-exhibit-index.md               # Numbered Exhibit List + officer highlighting guide
    05-filing-checklist.md            # Live-checked USCIS form editions, fees, Lockbox checks & assembly order
    06-blind-officer-audit.md         # Zero-Context Blind USCIS Officer Red-Team Audit & remediation plan
    exhibits/                         # Optional compiled/renamed exhibit PDFs with cover sheets
  post-filing/                        # Used when responding to an RFE or NOID
    notice/                           # RFE/NOID scan and verbatim issue breakdown
    response/                         # Issue-by-issue response brief, supplemental letters & exhibit list
```

- **Readable folder names:** Use whatever name the user prefers (`cases/eb1a/`, `cases/niw/`, `cases/my-case/`).
- **Preserve original files:** Never rename, alter, or delete files inside `materials/`.

---

## 2. Exhibit Numbering, Citations & Officer Highlighting

USCIS officers review large filings under tight time budgets (~15–30 minutes). Make every exhibit effortless to verify:

- **Group exhibits logically:**
  - **Exhibit A (`A-1`, `A-2`, ...):** Identity, passport/status, degrees, transcripts, credential evaluation, CV, and signed Personal Statement / Proposed Endeavor Plan (`02-personal-statement.md`).
  - **Exhibit B (`B-1`, `B-2`, ...):** Primary objective evidence grouped by EB-1A Criterion or NIW Prong (publications, independent citation excerpts, peer-review proofs, awards, patents, media coverage, adoption metrics, org charts, salary/wage benchmarks).
  - **Exhibit C (`C-1`, `C-2`, ...):** Expert recommendation letters paired with each recommender's CV/bio.
- **Pinpoint every factual claim:**
  - Cite both Exhibit ID and page number in the petition letter: `[Exhibit B-3, p. 2]`.
  - Never leave unverified `[TODO]` or `[Exhibit X]` placeholders in a ready deliverable.
- **Officer Highlighting & Cover Sheets:**
  - In `04-exhibit-index.md` (and when compiling `final/exhibits/`), note the exact lines/names to highlight in long exhibits (e.g., highlighting the applicant's name on a program committee roster, the exact sentence where an independent paper discusses the applicant's method, or the 90th-percentile wage row on a BLS/OFLC printout).

---

## 3. Core Deliverables Specification

### `final/00-assessment.md` — Case Assessment & Evidence Gap Plan
1. **Executive Summary:** Category (`EB-1A`, `EB-2 NIW`, or dual-track strategy), overall readiness, and 3–5 sentence case theory.
2. **Criterion / Prong Evaluation:**
   - **EB-1A:** Candidate criteria table (Strong / Moderate / Skip), Step 1 regulatory compliance under 8 C.F.R. § 204.5(h)(3)–(4), and Step 2 *Kazarian* Final Merits assessment.
   - **EB-2 NIW:** Advanced Degree / Exceptional Ability check, sharpened Proposed Endeavor definition, and *Dhanasar* Prongs 1, 2, and 3 analysis.
3. **Officer Pushback & RFE Preemption:** Specific weaknesses an adjudicator at TSC/NSC might target and how to close them before filing.
4. **Prioritized Action List:** Concrete additional documents or benchmarks to collect, ranked by impact.

### `final/01-petition-letter.md` — I-140 Petition Letter (Legal Brief)
Write in clear, authoritative legal prose suitable for direct compilation into DOCX, PDF, or LaTeX:
1. **Header & Re: Block:** Petitioner/Beneficiary, classification sought, and summary of enclosures.
2. **Section I — Executive Summary & Case Theory:** High-level roadmap so the officer immediately sees how every statutory requirement is met.
3. **Section II — Beneficiary's Background & Core Contributions:** Plain-language explanation of the domain bottleneck, what the applicant built/discovered, and measurable field impact.
4. **Section III — Detailed Legal & Evidentiary Analysis:**
   - **EB-1A:** Step 1 criterion-by-criterion proof (ordered strongest first), followed by a comprehensive Step 2 Final Merits totality analysis and U.S. continuation/benefit showing.
   - **EB-2 NIW:** EB-2 qualification, concrete Proposed Endeavor statement, and dedicated evidence-backed sections for *Dhanasar* Prongs 1, 2, and 3.
5. **Section IV — Conclusion:** Clean summary of eligibility and formal request for approval.

### `final/02-personal-statement.md` — Petitioner's Statement of Future Work / Proposed Endeavor
Both EB-1A (8 C.F.R. § 204.5(h)(5) continuing work in the U.S.) and EB-2 NIW benefit heavily from a dedicated, signed first-person statement by the applicant covering:
1. Core expertise and how past flagship achievements connect to future U.S. work.
2. Concrete 1–3 year technical/research/product/clinical plan in the United States.
3. Specific U.S. institutions, industry sectors, or national priorities that benefit from this work.

### `final/03-recommendation-letters/` — Recommender Portfolio & Anti-Template Drafts
When the user requests recommendation letter support:
1. **Portfolio Design (`00-recommender-plan.md`):**
   - Balance **independent experts** (who have never co-authored, worked with, or advised the applicant, and who know the applicant through published work, citations, or industry adoption) with **inner-circle experts** (advisors, managers, co-founders, or senior collaborators who can verify leading/critical roles and personal contributions).
   - Assign each recommender 1–2 distinct technical contributions or criteria/prongs so the letters complement rather than repeat one another.
2. **Anti-Template Drafting Rule:**
   - USCIS officers discount letters that share identical structure, phrasing, or transitions. Give each draft a distinct structure, tone, opening context, and technical focus tailored to that recommender's actual background and relationship to the work.
   - Ground every technical praise in a specific objective fact and cross-reference the corresponding exhibit.

### `final/04-exhibit-index.md` — Exhibit Index & Highlighting Guide
- Complete table mapping every Exhibit ID (`A-1`, `B-1`, `C-1`...) to its title, source file in `materials/` or `work/`, page count, what to highlight for the officer, and the exact legal element it proves.
- Flag any non-English document requiring a full English translation and signed certificate of translation accuracy (8 C.F.R. § 103.2(b)(3)).

### `final/05-filing-checklist.md` — Form Guide, Lockbox Trap Prevention & Live USCIS Check
Before finalizing filing instructions, verify current primary rules on `uscis.gov` and record the check date and source URLs:
1. **Form I-140 Self-Petitioner Field Checks:**
   - Part 1: Petitioner is the individual self-petitioner (verify consistency with Asylum Program Fee individual self-petitioner questions in Part 1 Q5/Q6).
   - Part 2: Classification box (`1.a` for EB-1A Extraordinary Ability; `1.h` / NIW for EB-2 National Interest Waiver).
   - Part 4: Processing route (Adjustment of Status in the U.S. vs. Consular Processing abroad) and accurate disclosure of any prior petitions.
2. **NIW Uncertified ETA-9089 / Appendix A:**
   - Verify the exact current form sections, Appendix A, and wet-ink/signed Final Determination pages required by current USCIS I-140 instructions for NIW self-petitioners.
3. **Fee Schedule & Payment Separation:**
   - Verify current I-140 base fee, Asylum Program Fee (confirming the reduced fee rule for individual self-petitioners on USCIS Form G-1055), and optional Form I-907 Premium Processing fee (15 business days for EB-1A; 45 business days for EB-2 NIW). Use separate payment instruments per form.
4. **Packet Assembly (Paper Lockbox vs. Online Filing):**
   - **Paper:** Single-sided printing, top-to-bottom assembly order (G-1145 -> payment -> I-907 -> I-140 -> ETA-9089 for NIW -> Petition Letter -> Exhibit Index -> Tabbed/Cover-Sheeted Exhibits A, B, C), original wet-ink signatures, and correct direct Lockbox address.
   - **Online / Digital:** File size, format, and naming compliance under current USCIS online account rules.

### `final/06-blind-officer-audit.md` — Zero-Context Blind USCIS Officer Red-Team Audit
To eliminate author confirmation bias ("drafting-context contamination"), run a strict **Information-Firewall Blind Review** where a fresh AI session or non-forked subagent simulates a skeptical TSC/NSC Immigration Services Officer (65-minute Premium Processing review clock):
1. **Strict Information Firewall:** The blind officer is **forbidden** from reading `materials/**`, `work/**` (`evidence-index.md`, `benchmarks-and-citations.md`, `case-strategy.md`), `final/00-assessment.md`, or `00-recommender-plan.md`. It may read **only** `final/01-petition-letter.md`, `final/03-recommendation-letters/*.md`, and `final/04-exhibit-index.md` (plus the governing legal standards `eb1a.md` / `niw.md`).
2. **7-Section Red-Team Output:**
   - Executive Adjudication Verdict (`APPROVABLE AS-IS` / `RFE LIKELY` / `NOID RISK`) & 60-second officer gut reaction
   - Criterion-by-Criterion (`Kazarian` Step 1 + Step 2) or Prong-by-Prong (`Dhanasar` Prongs 1–3 + 2025 Specialty Nexus) cold-read scorecard
   - Uncorroborated Claims & "Phantom Pinpoint" Ledger (claims in the brief where `04-exhibit-index.md` lacks the claimed proof)
   - Brief-to-Letter Circularity & Inner-Circle Echo Stress-Test
   - Self-Sabotage, Advisor Subordination & 20-Minute Readability Audit
   - Simulated Verbatim USCIS RFE / NOID Notice Excerpts
   - Prioritized Pre-Filing Remediation Plan

---

## 4. RFE / NOID Response Workflow (`post-filing/`)

When responding to a Request for Evidence (RFE) or Notice of Intent to Deny (NOID):
1. **Preserve the filed baseline:** Never overwrite `final/` from the original filing; work inside `post-filing/`.
2. **Deconstruct the notice verbatim (`post-filing/notice/issue-map.md`):**
   - Record the exact deadline (distinguishing RFE vs. strict 30-day NOID deadlines) and return address.
   - Map every criterion/prong the officer accepted vs. challenged, and identify whether each objection stems from: (a) overlooked exhibits already in the record, (b) legal/policy misapplication by the officer, or (c) a genuine evidentiary gap.
3. **Evaluate Response vs. Refile Strategy:**
   - Honestly assess whether the notice is highly winnable on response or whether (when priority date / status allows) withdrawing and refiling a stronger packet is a strategic option to discuss.
4. **Respect the Priority/Filing Date Cutoff (8 C.F.R. § 103.2(b)(1)):**
   - Eligibility must exist at the time of filing. Use new evidence to prove pre-existing standing, clarify facts that existed at filing, or show continuing downstream impact of pre-filing work; never pass off post-filing achievements as pre-filing eligibility.
5. **Draft a Surgical Response Package (`post-filing/response/`):**
   - Produce `01-rfe-response-letter.md` (answering every officer point in the exact order raised in the notice), `02-supplemental-exhibit-index.md`, and any supplemental expert letters or updated benchmarks.

---

## 5. Automated Pre-Filing Audit, LaTeX Exhibit Engine & Studio Workbench

1. **Deterministic Case Linter (`scripts/petition-toolkit.mjs`):**
   - Before declaring a case package ready, run:
     ```bash
     node scripts/petition-toolkit.mjs audit-case --case cases/<case-name>
     ```
   - Verify that the audit reports **0 errors** across:
     - **Exhibit Cross-References & Pinpoints:** Every `[Exhibit X, p. Y]` cited in `01-petition-letter.md` and `02-personal-statement.md` exists in `04-exhibit-index.md`, includes a page/paragraph/table pinpoint, and leaves no unreferenced orphan exhibits.
     - **Unresolved Placeholders:** Zero `[TODO]`, `[TBD]`, `[INSERT]`, or `[Exhibit X]` placeholders remain.
     - **Category-Bleed Guard:** EB-2 NIW briefs contain zero EB-1A-exclusive standards (`204.5(h)`, `Kazarian`, `sustained acclaim`), and EB-1A briefs contain zero NIW-exclusive standards (`Dhanasar`, `204.5(k)(2)`).
     - **6-Word Shingle Jaccard Similarity (`< 12%` target):** Pairwise 6-word shingle overlap across recommendation letters in `final/03-recommendation-letters/` stays below `0.12` (`warn > 0.12`, `fail > 0.22`).
     - **AI-Cliché & PII Check:** Zero banned AI hyperbole phrases (`testament to`, `beacon of`, `unwavering commitment`, `delve into`, `groundbreaking paradigm shift`) and no raw SSNs or A-Numbers exposed in prose drafts.
2. **Bidirectional Hyperlinked LaTeX Exhibit Engine (`templates/latex-exhibit-engine.tex`):**
   - When compiling print-ready or digital PDF packages via LaTeX, use `templates/latex-exhibit-engine.tex` so `\citeex{B-1}{p.~4}` links directly to Exhibit `B-1` and `\exhibitcoversheet{B-1}{...}` automatically lists every page in the brief where that exhibit is cited.
3. **Local AI Command Center & Workbench (`studio.mjs`):**
   - Users can launch the zero-dependency visual workbench (`node studio.mjs` -> `http://127.0.0.1:3030`) to inspect files, run OpenAlex 3-Tier citation harvesting, monitor live linter scores, dispatch CLI agents, or print formatted legal briefs to PDF.

