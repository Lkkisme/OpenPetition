# OpenPetition

**English** | [简体中文](README.zh-CN.md)

A local-first workspace, zero-dependency **AI Command Center & Legal Workbench**, and **AI Agent Skill** (`$openpetition`) for preparing evidence-based U.S. **EB-1A** (Extraordinary Ability) and **EB-2 NIW** (National Interest Waiver) self-petitions.

Open this repository in **Codex**, **Claude Code**, **Cursor**, **Antigravity**, or launch the built-in **OpenPetition Studio** (`node studio.mjs`) to manage your case files, harvest live OpenAlex citation percentiles with 3-tier co-author screening, draft legal briefs and non-templated recommendation letters, and audit exhibit cross-references before filing.

---

## Quick Start

### 1. Clone or download this repository

```bash
git clone https://github.com/Lkkisme/OpenPetition.git
cd OpenPetition
```

*(Or click **Code → Download ZIP** on GitHub and extract it on your computer.)*

### 2. Place your materials in `cases/`

Create a human-readable folder under `cases/` (everything inside `cases/` is ignored by Git) and drop your existing documents into `materials/`:

```text
cases/
  my-eb1a/                 # or cases/my-niw/
    materials/             # CV, scholar profile, papers, patents, product/repo docs, reviews, awards, salary records...
```

Or initialize a structured workspace from the terminal:

```bash
node scripts/petition-toolkit.mjs init cases/my-eb1a --category EB-1A
```

### 3. Option A — Launch the Visual AI Command Center (`OpenPetition Studio`)

Requires only Node.js (zero `npm install` dependencies):

```bash
node studio.mjs
```

Open **`http://127.0.0.1:3030`** in your browser:
- **Live Disk Sync:** Directly reads and writes human-readable files in `cases/<case-name>/`. Any file created or updated by your IDE agent (Codex, Claude Code, Cursor, Antigravity) updates in real time via Server-Sent Events (SSE).
- **8-Stage AI Agent Mission Control:** Copy context-aware `$openpetition` prompts for any stage in 1 click, or dispatch local CLI agents (`codex exec`, `claude -p`) with live streaming terminal output.
- **OpenAlex 3-Tier Citation Harvester:** Screen citing works against the applicant's entire **Lifetime Co-Author Graph** (`Strictly Independent` vs. `Co-Author Network` vs. `Direct Self`), compute year- and subfield-normalized citation percentiles (`citation_normalized_percentile`, `fwci`), and extract global/corporate/government adoption footprints.
- **Pre-Filing Linter & Recommender Similarity Radar:** Automatically checks `[Exhibit X, p. Y]` pinpoint cross-references, flags unresolved `[TODO]` placeholders or category bleed, scans for banned AI clichés, and computes pairwise **6-word shingle Jaccard similarity** (`< 12%` target) across recommendation letters.
- **Split-Pane Legal Brief Studio & PDF Print View:** Edit markdown deliverables side-by-side with an adjudicator-styled preview and 1-click print/export to PDF.

### 4. Option B — Work Directly in Your AI Coding Agent

Open the `OpenPetition` directory in **Codex**, **Claude Code**, **Cursor**, or **Antigravity** and describe what you need (or invoke `$openpetition`):

- **Case Assessment, Active Benchmarking & Gap Plan:**
  > Read my materials in `cases/my-eb1a/materials`, research any missing venue/citation/salary benchmarks, and write an EB-1A assessment (`final/00-assessment.md`) covering my strongest criteria, Final Merits strengths and risks, and the highest-priority evidence to add next.

- **EB-2 NIW Endeavor, Personal Statement & Petition Brief:**
  > I am preparing an EB-2 NIW petition from `cases/my-niw/materials`. Help me sharpen my Proposed Endeavor, draft my Personal Statement (`final/02-personal-statement.md`), build the exhibit index (`final/04-exhibit-index.md`), and write the full I-140 petition letter (`final/01-petition-letter.md`).

- **Recommendation Letter Portfolio & Anti-Template Drafts:**
  > Based on `cases/my-eb1a`, design a recommender portfolio (`final/03-recommendation-letters/00-recommender-plan.md`) balancing independent and inner-circle experts, and draft distinct, non-templated letters mapped to my key contributions.

- **RFE / NOID Surgical Response:**
  > My filed petition is in `cases/my-eb1a/final` and the USCIS RFE notice is in `cases/my-eb1a/post-filing/notice`. Map every issue raised by the officer and draft a point-by-point response brief.

---

## Deterministic CLI Toolkit (`scripts/petition-toolkit.mjs`)

```bash
# 1. Initialize a clean case directory
node scripts/petition-toolkit.mjs init cases/my-eb1a --category EB-1A

# 2. Harvest OpenAlex citation percentiles & 3-Tier Lifetime Co-Author Graph filter
node scripts/petition-toolkit.mjs harvest-citations --author "Your Name" --case cases/my-eb1a

# 3. Audit exhibit cross-references, pinpoints, category bleed, AI cliches & letter similarity
node scripts/petition-toolkit.mjs audit-case --case cases/my-eb1a
```

---

## Full-Lifecycle Capabilities

| Component | What OpenPetition Provides |
| :--- | :--- |
| **Evidence & 3-Tier Citation Benchmarking (`work/`)** | Parses PDFs, Word docs, images, and emails in `materials/`; harvests OpenAlex `citation_normalized_percentile` & `fwci`, filters self and lifetime co-author network citations, and cross-checks BLS OEWS 90th-percentile / DOL OFLC Level IV wages. |
| **Case Assessment (`final/00-assessment.md`)** | Evaluates records for **Researchers**, **Industry Engineers**, **Founders**, or **Clinicians** using the 4-Axis Evidence Matrix (`8 C.F.R. § 103.2(b)(2)` primary vs. secondary evidence hierarchy), anticipates TSC/NSC RFE pushback, and prioritizes evidence gaps. |
| **I-140 Petition Letter (`final/01-petition-letter.md`)** | Drafts a structured legal brief anchored in binding precedent (*Matter of Chawathe*, *Kazarian*, *Matter of Dhanasar*), 2023–2025 USCIS Policy Manual updates (`PA-2023-26`, `PA-2024-24`, `PA-2025-03`), and federal case law (*Mukherji v. Miller*, *Chursov*, *Rubin*, *Buletini*, *Muni*). |
| **Personal Statement (`final/02-personal-statement.md`)** | Drafts a concrete first-person Statement of Future Work (EB-1A § 204.5(h)(5)) or Proposed Endeavor Statement (EB-2 NIW) with a 1–3 year technical/operational roadmap. |
| **Recommendation Letters (`final/03-recommendation-letters/`)** | Balances strictly independent experts (verified zero co-author/institutional overlap) with inner-circle experts, enforcing `< 12%` 6-word shingle Jaccard similarity across letters. |
| **Exhibit Package, LaTeX Engine & Form Check (`final/04-exhibit-index.md`, `05-filing-checklist.md`)** | Builds a numbered Exhibit Index with scanner-proof officer highlighting instructions, includes `templates/latex-exhibit-engine.tex` for bidirectional hyperlinked Exhibit Cover Sheets, and verifies Form I-140 self-petitioner fields ($300 Asylum Program Fee in Part 1 Q5/Q6; 3-part uncertified FLAG ETA-9089 for NIW). |
| **RFE / NOID Response (`post-filing/`)** | Deconstructs officer objections verbatim, checks for premature *Kazarian* Step 1/Step 2 conflation or *Chawathe* violations, enforces the 8 C.F.R. § 103.2(b)(1) priority-date cutoff, and drafts a surgical point-by-point rebuttal. |

---

## Supported Categories & Profiles

OpenPetition adapts to **Academic Researchers**, **Industry Engineers / Builders**, **Startup Founders / Entrepreneurs**, and **Clinicians / Applied Practitioners**, while keeping the two statutory standards strictly distinct:

- **EB-1A (Extraordinary Ability — INA § 203(b)(1)(A), 8 C.F.R. § 204.5(h), *Kazarian*):**
  - **Step 1:** Satisfy at least 3 of the 10 regulatory criteria, a one-time major international award, or comparable evidence under 8 C.F.R. § 204.5(h)(4), ordered by persuasive force.
  - **Step 2 (Final Merits):** Establish sustained national or international acclaim, standing among the small percentage at the top of the field (requiring articulated reasoning under *Mukherji v. Miller* (2026)), and continued work in the area of extraordinary ability in the United States.
  - Reference: [.agents/skills/openpetition/references/eb1a.md](.agents/skills/openpetition/references/eb1a.md)

- **EB-2 NIW (National Interest Waiver — INA § 203(b)(2)(B), 8 C.F.R. § 204.5(k), *Matter of Dhanasar*):**
  - **Step 1:** Establish underlying EB-2 qualification (Advanced Degree Professional or Exceptional Ability, with explicit specialty nexus under the Jan. 15, 2025 USCIS Policy Manual update `PA-2025-03`).
  - **Step 2:** Define a concrete **Proposed Endeavor** and establish all three *Dhanasar* prongs: (1) Substantial Merit and National Importance, (2) Well Positioned to Advance the Endeavor, and (3) On Balance Beneficial to Waive the Job Offer and PERM Labor Certification.
  - Reference: [.agents/skills/openpetition/references/niw.md](.agents/skills/openpetition/references/niw.md)

---

## Workspace Structure

```text
OpenPetition/
├── AGENTS.md                                                    # Entry point for Codex / Cursor / Antigravity
├── CLAUDE.md                                                    # Entry point for Claude Code
├── studio.mjs                                                   # Zero-dependency Local AI Command Center & Legal Workbench
├── scripts/
│   └── petition-toolkit.mjs                                     # CLI for OpenAlex 3-tier citation harvesting & pre-filing audit
├── templates/
│   └── latex-exhibit-engine.tex                                 # Bidirectional hyperlinked LaTeX brief & exhibit cover sheet engine
├── .agents/skills/openpetition/
│   ├── SKILL.md                                                 # Core workflow, active benchmarking & advocacy rules
│   └── references/
│       ├── eb1a.md                                              # EB-1A criteria, 2023-2024 Policy Manual & federal case law
│       ├── niw.md                                               # EB-2 eligibility, Dhanasar 3 prongs & Jan 2025 policy update
│       ├── benchmarking-and-evidence-research.md                # 3-Tier Co-Author filter, OpenAlex percentiles & BLS/OFLC wages
│       ├── recommendation-letters-and-statements.md             # Recommender matrix, shingle anti-template rules & statements
│       ├── workspace-and-deliverables.md                        # Case folder layout, exhibit highlighting & deliverable specs
│       └── filing-forms-and-rfe.md                              # Form I-140/ETA-9089 traps, Lockbox assembly & RFE/NOID guide
└── cases/                                                       # Git-ignored private directory for your cases
    └── <case-name>/
        ├── materials/                                           # Raw files (read-only)
        ├── work/                                                # Evidence index, benchmark research & audit reports
        ├── final/                                               # Assessment, Petition Letter, Statement, Letters, Exhibits
        └── post-filing/                                         # RFE / NOID notices & responses
```

---

## Privacy & Disclaimer

- **Local storage:** `cases/` is git-ignored by default so your documents stay in your local workspace.
- **Model provider privacy:** Your AI agent sends context to whichever model provider you configure. Review your tool's data-retention settings before processing sensitive identity records.
- **Not legal representation:** OpenPetition is an open-source document preparation workspace, verification toolkit, and agent skill. It does not provide licensed attorney representation, create an attorney-client relationship, or guarantee USCIS approval.

## License

[MIT License](LICENSE)
