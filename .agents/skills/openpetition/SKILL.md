---
name: openpetition
description: Prepare evidence-based U.S. EB-1A (Extraordinary Ability) and EB-2 NIW (National Interest Waiver) self-petitions, active benchmark research, assessments, recommendation letters, personal statements, exhibit packages, form checks, and RFE/NOID responses.
---

# OpenPetition

Prepare rigorous, evidence-backed **EB-1A** and **EB-2 NIW** self-petitions from local materials and active public-source research.

## Reference Guides in This Skill

Consult the matching reference whenever executing that part of a case:
- **EB-1A Legal & Evidentiary Standard:** [references/eb1a.md](references/eb1a.md)
- **EB-2 NIW Legal & Evidentiary Standard:** [references/niw.md](references/niw.md)
- **Active Benchmarking & Citation/Wage Research:** [references/benchmarking-and-evidence-research.md](references/benchmarking-and-evidence-research.md)
- **Recommendation Letters & Personal Statements:** [references/recommendation-letters-and-statements.md](references/recommendation-letters-and-statements.md)
- **Workspace Layout & Deliverable Specifications:** [references/workspace-and-deliverables.md](references/workspace-and-deliverables.md)
- **Form I-140 / ETA-9089 Traps, Lockbox Assembly & RFE/NOID Playbook:** [references/filing-forms-and-rfe.md](references/filing-forms-and-rfe.md)

---

## Core Operating Principles

1. **Adapt to the Applicant's Profile (No Academic-Only Mold)**
   - Tailor the case strategy to who the applicant actually is:
     - **Academic / Scientist:** Publications, independent citation impact, peer review, editorial roles, grant panels, and research adoption.
     - **Industry Engineer / Tech Builder:** Critical or leading roles at distinguished organizations, system architecture/production impact, patents, open-source adoption, technical judging, high remuneration, and comparable evidence (8 C.F.R. § 204.5(h)(4)).
     - **Founder / Entrepreneur:** Venture/angel backing, SBIR/STTR or government grants, revenue/user traction, intellectual property, media coverage, and USCIS Policy Manual entrepreneur pathways.
     - **Clinician / Applied Practitioner:** Clinical trial leadership, treatment guidelines/protocols, device/diagnostic deployment, and national health or industry ripple effects.
   - Never force an industry builder or founder into a "paper count + Google Scholar citation" template.

2. **Proactively Research & Build Objective Benchmarks**
   - Follow [references/benchmarking-and-evidence-research.md](references/benchmarking-and-evidence-research.md). Do not just passively read what the user already dropped into `materials/`. Use available web search, public APIs (e.g., OpenAlex), and local scripts to gather missing objective corroboration into `work/benchmarks-and-citations.md`:
     - **Citation & Adoption Context:** Query OpenAlex or bibliographic records for year- and subfield-normalized citation percentiles (`citation_normalized_percentile`, `fwci`), filter out self/co-author citations, and extract specific passages where independent teams discuss or adopt the applicant's work.
     - **Field & Venue Benchmarks:** Look up journal impact factors, JCR quartiles, h5-index, and conference acceptance rates / CORE rankings.
     - **Organization & Media Standing:** Gather independent proof of employer/institution rankings, scale, valuation, funding, or media outlet circulation/readership.
     - **Salary & Wage Benchmarks:** Cross-check compensation against matched SOC code and metropolitan area benchmarks (BLS OEWS 90th percentile, DOL OFLC Level IV, and industry compensation surveys).

3. **Write for a 20-Minute USCIS Adjudication**
   - USCIS officers review massive files under tight time constraints. Structure every petition letter, exhibit cover sheet, and RFE response so an officer can verify both the **plain-language significance** and the **exact regulatory element** in seconds:
     - Lead each section with a clear thesis and conclusion before diving into technical detail.
     - Translate domain jargon into concrete cause-and-effect (`prior bottleneck -> what the applicant specifically created or led -> measurable result -> independent reliance across the field`).
     - Pinpoint every material assertion to an exact exhibit and page (`[Exhibit B-2, p. 4]`).

4. **Zero Self-Sabotage & Affirmative Legal Advocacy (Never Write CYA Disclaimers into Filing Prose)**
   - Keep vulnerability analysis and red-team stress testing strictly inside `work/case-strategy.md` and `final/00-assessment.md`—**never inside the USCIS-facing petition brief or recommendation letters**.
   - **Never write self-sabotaging concessions or invented downgrade labels into `01-petition-letter.md`:**
     - Do not volunteer co-author overlap confessions (e.g., never write *"while there is overlapping collaboration"*), equal-contributor self-demotions, or defensive CYA caveats in the brief.
     - Do not invent derogatory labels for completed peer reviews routed through a senior scholar or editor (never call them *"mentor-mediated evaluations"* or *"assisted reviews"*—present completed review records positively on their objective completion proof).
     - Do not belittle awards or finalist honors with self-invented downgrade labels (e.g., never call them *"contextual developmental recognitions"* or erase a strong national/international finalist distinction merely because supporting awards are narrower).
     - Avoid flat "book-report" summaries of paper abstracts; every paragraph under Authorship or Original Contributions must advance why the work places the applicant at the top of the field.

5. **Fuse Methodology Creation with Scientific/Technical Breakthroughs (Never Reduce the Applicant to a Mere Implementer)**
   - **Original Contributions:** Never sever the scientific or engineering breakthrough from the applicant's technical work by framing an advisor, PI, or executive as the source of *"scientific direction/strategy"* and the applicant as a mere *"implementer / technician / tool builder."* When the applicant designed, built, modeled, or validated the experimental, computational, or systems methodology that unlocked the discovery, show that the methodology and new measurement/analytical capability *is* the core advance evaluated and adopted by independent peers.
   - **Leading or Critical Role:** Do not shrink an applicant's critical role to narrow task scheduling on a single sub-project when the record supports foundational, cross-project impact across the laboratory's or organization's flagship outputs and funded grants. Prove both (a) how the applicant's technical leadership drove the establishment's core successes across its portfolio, and (b) the distinguished reputation of both the unit/laboratory and its parent institution/company through competitive federal funding, flagship outputs, rankings, and independent media coverage.
   - **Post-RFE / Post-Denial Overhaul (No Minimal-Diff Inertia):** When responding to an RFE/NOID or preparing a post-denial refile, never treat pre-notice draft prose as sacred or optimize for minimal word changes. Completely rewrite any criterion framing or Final Merits narrative that the adjudicator rejected, while keeping original filed documents and signed returns immutable as historical records.

---

## End-to-End Workflow

1. **Resolve the Case Folder**
   - Default to `cases/<case-name>/` (e.g., `cases/eb1a/` or `cases/niw/`) or any private directory the user specifies.
   - Follow [references/workspace-and-deliverables.md](references/workspace-and-deliverables.md):
     ```text
     cases/<case-name>/
       materials/     # Raw user files (read-only; never overwrite in place)
       work/          # Evidence index, active benchmark research, and strategy notes
       final/         # Assessment, petition letter, personal statement, letters, exhibit index, checklist
       post-filing/   # RFE / NOID notices, issue maps, and response packages
     ```

2. **Ingest Materials & Map Evidence (`work/evidence-index.md`)**
   - Read all files in `materials/` (PDFs, Word docs, images, screenshots, LaTeX/Markdown drafts, emails). Render PDFs or run OCR when layout or scanned text matters.
   - Extract verified facts, dates, roles, metrics, and page numbers. Never ask the user for facts already present in their files.

3. **Clarify Only High-Leverage Missing Facts**
   - Ask concise, targeted questions directly in chat only when missing information materially changes:
     - Category strategy (`EB-1A`, `EB-2 NIW`, or a dual-filing strategy locking in an NIW priority date while pursuing EB-1A under 8 C.F.R. § 204.5(e))
     - Concrete U.S. continuation plan / Proposed Endeavor details
     - Specific individual role or unrecorded downstream adoption of flagship work
     - Potential recommenders and their relationship to the applicant (independent vs. inner-circle)
     - Filing route (online vs. paper Lockbox, Premium Processing timing, concurrent/pending I-485, or RFE deadline)

4. **Apply the Governing Legal Standard**
   - **EB-1A (Extraordinary Ability):** Read [references/eb1a.md](references/eb1a.md). Keep **Step 1** (satisfying at least 3 of the 10 regulatory criteria under 8 C.F.R. § 204.5(h)(3), a one-time major award, or comparable evidence under § 204.5(h)(4)) distinct from **Step 2** (*Kazarian* Final Merits Determination on sustained acclaim, top-of-field standing, and continued U.S. work).
   - **EB-2 NIW (National Interest Waiver):** Read [references/niw.md](references/niw.md). Keep **Step 1** (Advanced Degree Professional or Exceptional Ability under 8 C.F.R. § 204.5(k)) distinct from **Step 2** (a concrete Proposed Endeavor satisfying all three *Matter of Dhanasar* prongs).

5. **Produce & Compile Complete Deliverables (`final/` or `post-filing/`)**
   - Follow [references/workspace-and-deliverables.md](references/workspace-and-deliverables.md), [references/recommendation-letters-and-statements.md](references/recommendation-letters-and-statements.md), and [references/filing-forms-and-rfe.md](references/filing-forms-and-rfe.md) to generate the deliverables requested by the user:
     - `final/00-assessment.md` — Case Assessment, Criterion/Prong Selection & Gap Plan
     - `final/01-petition-letter.md` — Full I-140 Petition Letter / Legal Brief
     - `final/02-personal-statement.md` — Petitioner's Statement of Future Work / Proposed Endeavor Statement
     - `final/03-recommendation-letters/` — Recommender Portfolio Plan & Distinct, Non-Templated Letter Drafts
     - `final/04-exhibit-index.md` — Numbered Exhibit Index & Highlighting Guide
     - `final/05-filing-checklist.md` — Live-Checked USCIS Form Guide, Lockbox Rejection Prevention & Assembly Order
     - `final/06-blind-officer-audit.md` — Zero-Context Blind USCIS Officer Red-Team Audit & Pre-Filing Remediation Plan
     - `post-filing/` — RFE / NOID Verbatim Issue Map, Response vs. Refile Analysis, and Point-by-Point Rebuttal Brief
     - **Print/Upload Compilation:** When requested, compile deliverables into formatted `.docx`, `.pdf`, or `.tex` files (using `templates/latex-exhibit-engine.tex` for bidirectional hyperlinked Exhibit Cover Sheets) so the package is ready for printing or USCIS online upload.

6. **Run Deterministic Citation Harvesting, Pre-Filing Audit & Zero-Context Blind Officer Review**
   - Use the built-in zero-dependency toolkit to harvest live OpenAlex citation percentiles and screen the 3-Tier Lifetime Co-Author Graph:
     ```bash
     node scripts/petition-toolkit.mjs harvest-citations --author "<Applicant Name>" --case cases/<case-name>
     ```
   - Before finalizing any deliverable package, run the pre-filing linter to verify exhibit cross-references, pinpoint page citations, category-bleed rules, banned AI clichés, and 6-word shingle Jaccard similarity (`< 12%`) across recommendation letters:
     ```bash
     node scripts/petition-toolkit.mjs audit-case --case cases/<case-name>
     ```
   - **Zero-Context Blind USCIS Officer Audit (`final/06-blind-officer-audit.md`):** After `audit-case` passes, run a strict **Information-Firewall Blind Review** (either by spawning a fresh non-forked subagent or running Stage 08 in `studio.mjs`). The blind reviewer acts as a skeptical TSC/NSC Officer with 65 minutes on the clock, reading **ONLY** `final/01-petition-letter.md`, `final/03-recommendation-letters/*.md` (excluding `00-recommender-plan.md`), and `final/04-exhibit-index.md` (**forbidden** from reading `materials/`, `work/`, or `00-assessment.md`) to catch every uncorroborated claim, phantom pinpoint, brief-to-letter circularity, or RFE opening before filing.
   - Users can also launch the visual AI Command Center & Legal Workbench via `node studio.mjs` (`http://127.0.0.1:3030`).

---

## Integrity & Safety Boundaries

- **Strict factual honesty:** Distinguish verified record facts, public-source benchmarks, user-stated facts awaiting documentation, and legal arguments. Never invent citations, percentiles, rankings, adoption claims, or approval guarantees.
- **Live USCIS verification:** Form editions (I-140, ETA-9089 / Appendix A, I-907, G-1145, G-1450), fee amounts (including the Asylum Program Fee self-petitioner rules), Premium Processing timelines (15 vs. 45 business days), and filing addresses change frequently. Verify live primary sources on `uscis.gov` before finalizing filing instructions.
- **Privacy protection:** Keep all applicant materials, notes, and drafts inside git-ignored private folders (`cases/`). Never commit personal data, receipt numbers, A-numbers, or signatures.
