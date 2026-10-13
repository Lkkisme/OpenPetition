# OpenPetition

OpenPetition is a local-first workspace and AI agent skill for preparing evidence-based U.S. **EB-1A** (Extraordinary Ability) and **EB-2 NIW** (National Interest Waiver) self-petitions.

## How to Handle Applicant Cases

1. **Read the skill and relevant reference guides first:**
   - Core workflow: [.agents/skills/openpetition/SKILL.md](.agents/skills/openpetition/SKILL.md)
   - EB-1A criteria & *Kazarian* Final Merits: [.agents/skills/openpetition/references/eb1a.md](.agents/skills/openpetition/references/eb1a.md)
   - EB-2 NIW eligibility & *Dhanasar* 3 prongs: [.agents/skills/openpetition/references/niw.md](.agents/skills/openpetition/references/niw.md)
   - Active bibliometric, citation, venue & wage benchmarking: [.agents/skills/openpetition/references/benchmarking-and-evidence-research.md](.agents/skills/openpetition/references/benchmarking-and-evidence-research.md)
   - Recommendation letter portfolio (anti-template rules) & personal statements: [.agents/skills/openpetition/references/recommendation-letters-and-statements.md](.agents/skills/openpetition/references/recommendation-letters-and-statements.md)
   - Case folder layout, exhibit citations & deliverable specs: [.agents/skills/openpetition/references/workspace-and-deliverables.md](.agents/skills/openpetition/references/workspace-and-deliverables.md)
   - Form I-140 / ETA-9089 traps, Lockbox assembly & RFE/NOID playbook: [.agents/skills/openpetition/references/filing-forms-and-rfe.md](.agents/skills/openpetition/references/filing-forms-and-rfe.md)

2. **Work directly in the user's case folder:**
   - Default to `cases/<case-name>/` (e.g., `cases/eb1a/` or `cases/niw/`) or any private local folder the user specifies.
   - Treat `materials/` as read-only original files. Write intermediate extraction, benchmark research, and strategy notes to `work/` and polished outputs to `final/` (or `post-filing/` for RFE/NOID responses).
   - Clarify missing facts directly with the user in chat and focus strictly on applicant-facing deliverables.

3. **Protect applicant privacy:**
   - Never commit applicant files, names, receipt numbers, A-numbers, signatures, or generated case documents to Git.
   - Keep all case work inside git-ignored private folders.
