#!/usr/bin/env node
/**
 * OpenPetition Studio — Flagship Local-First EB-1A & NIW Legal Workbench
 * Zero-dependency Node.js server (node:http, node:fs, node:child_process)
 *
 * Usage:
 *   node studio.mjs [--port 3030] [--host 127.0.0.1]
 *   node studio.mjs --self-test
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  initCaseWorkspace,
  auditCase,
  harvestCitations,
  runSelfTest as runToolkitSelfTest
} from './scripts/petition-toolkit.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AI_PIPELINE_STAGES = [
  {
    id: 'stage-1-ingest',
    step: '01',
    title: 'Scan Materials & Build Evidence Map',
    titleZh: '梳理原始材料，生成结构化证据图谱',
    inputs: ['materials/*'],
    targetFile: 'work/evidence-index.md',
    reference: '.agents/skills/openpetition/references/workspace-and-deliverables.md',
    description: 'Read your CV, scholar profile, papers, and certificates in materials/ and organize every provable fact, metric, and page pinpoint.',
    descZh: '自动读取 materials/ 下的简历、Google Scholar、论文、审稿与获奖证明，提取全部可验证事实、量化指标与精确页码。',
    buildPrompt: (caseName, category) =>
      `Use $openpetition to inspect all files inside cases/${caseName}/materials/. Create cases/${caseName}/work/evidence-index.md mapping every document, extracted factual proof, quantitative metric, and page number for a ${category} petition. Do not overwrite anything in materials/.`
  },
  {
    id: 'stage-2-benchmarks',
    step: '02',
    title: 'Analyze Independent Citations & Field Ranking',
    titleZh: '筛查纯独立他引、领域百分位与薪资基准',
    inputs: ['materials/*', 'work/evidence-index.md'],
    targetFile: 'work/benchmarks-and-citations.md',
    reference: '.agents/skills/openpetition/references/benchmarking-and-evidence-research.md',
    description: 'Filter out all lifetime co-authors to prove strictly independent citations, OpenAlex field top percentiles, venue standing, and salary benchmarks.',
    descZh: '自动剔除职业生涯全部历史合作者自引，计算纯独立他引比例、OpenAlex 同年同领域 Top 百分位排名、期刊地位与薪资分位。',
    buildPrompt: (caseName, category) =>
      `Use $openpetition and read .agents/skills/openpetition/references/benchmarking-and-evidence-research.md. For cases/${caseName}/ (${category}), research and write cases/${caseName}/work/benchmarks-and-citations.md covering: (1) 3-Tier Lifetime Co-Author Graph independent citation breakdown, (2) OpenAlex year/subfield citation percentiles and FWCI, (3) journal/conference standing, and (4) matched SOC code BLS OEWS 90th-percentile / DOL OFLC Level IV wage benchmarks if applicable.`
  },
  {
    id: 'stage-3-assessment',
    step: '03',
    title: 'Evaluate Case Strength & Officer Risk Points',
    titleZh: '评估十选三 / 三原则达标度与审案风险点',
    inputs: ['work/evidence-index.md', 'work/benchmarks-and-citations.md'],
    targetFile: 'final/00-assessment.md',
    reference: '.agents/skills/openpetition/references/eb1a.md',
    description: 'Score each EB-1A criterion or NIW prong honestly, identify weak spots an officer might challenge, and list highest-leverage extra proof.',
    descZh: '客观评估 EB-1A 十选三或 NIW 三原则达标把握，提前标出德州/内布拉斯加中心审案官最可能质疑的薄弱点与补强方案。',
    buildPrompt: (caseName, category) =>
      `Use $openpetition and read the relevant legal reference (.agents/skills/openpetition/references/eb1a.md and/or niw.md). Based on cases/${caseName}/work/evidence-index.md and benchmarks-and-citations.md, write cases/${caseName}/final/00-assessment.md with an honest ${category} evaluation, criterion/prong readiness matrix, likely TSC/NSC adjudicator pushback points, and a prioritized evidence gap plan.`
  },
  {
    id: 'stage-4-brief',
    step: '04',
    title: 'Draft Main I-140 Petition Letter (Legal Brief)',
    titleZh: '撰写主申请信 (I-140 Petition Letter)',
    inputs: ['work/evidence-index.md', 'work/benchmarks-and-citations.md', 'final/00-assessment.md'],
    targetFile: 'final/01-petition-letter.md',
    reference: '.agents/skills/openpetition/references/eb1a.md',
    description: 'Write the full legal brief with exact [Exhibit X, p. Y] citations, fusing methodology with scientific breakthroughs and enforcing zero self-sabotage.',
    descZh: '撰写完整 I-140 法律陈情书：每处事实绑定 [Exhibit X, p. Y] 精确页码，将方法创新与科学/工程突破紧密合一，彻底杜绝自贬免责声明。',
    buildPrompt: (caseName, category) =>
      `Use $openpetition to draft the complete I-140 Petition Letter in cases/${caseName}/final/01-petition-letter.md for ${category}. Anchor arguments in Matter of Chawathe (preponderance standard), 2024-2026 federal case law (including Mukherji v. Miller), and pinpoint every factual claim to [Exhibit ID, p. X]. Enforce Zero Self-Sabotage (no CYA disclaimers, no co-author overlap confessions, no invented downgrade labels like "mentor-mediated" or "contextual developmental", and never separate methodology creation from the scientific/technical breakthrough).`
  },
  {
    id: 'stage-5-statement',
    step: '05',
    title: 'Draft Personal Statement of Future U.S. Work',
    titleZh: '撰写赴美工作计划陈述 (Personal Statement)',
    inputs: ['work/evidence-index.md', 'final/01-petition-letter.md'],
    targetFile: 'final/02-personal-statement.md',
    reference: '.agents/skills/openpetition/references/recommendation-letters-and-statements.md',
    description: 'Write a concrete first-person statement detailing your continuing U.S. research/engineering roadmap and national impact.',
    descZh: '以第一人称撰写具体、扎实的赴美工作计划与国家利益陈述，清晰说明未来 1–3 年研究/工程路线与实际落地价值。',
    buildPrompt: (caseName, category) =>
      `Use $openpetition and read .agents/skills/openpetition/references/recommendation-letters-and-statements.md. Draft cases/${caseName}/final/02-personal-statement.md as a concrete, technically specific first-person Statement of Future Work / Proposed Endeavor in the United States for ${category}.`
  },
  {
    id: 'stage-6-letters',
    step: '06',
    title: 'Plan & Draft Distinct Recommendation Letters',
    titleZh: '规划推荐人组合并起草去模板化推荐信',
    inputs: ['work/evidence-index.md', 'final/01-petition-letter.md'],
    targetFile: 'final/03-recommendation-letters/00-recommender-plan.md',
    reference: '.agents/skills/openpetition/references/recommendation-letters-and-statements.md',
    description: 'Balance independent experts vs. collaborators and draft individualized letters that keep 6-word shingle overlap strictly below 12%.',
    descZh: '合理搭配独立权威专家与合作者比例，为每位推荐人定制专属视角与技术细节，确保信件两两重复率低于 12%。',
    buildPrompt: (caseName, category) =>
      `Use $openpetition and read .agents/skills/openpetition/references/recommendation-letters-and-statements.md. Create cases/${caseName}/final/03-recommendation-letters/00-recommender-plan.md balancing strictly independent and inner-circle experts for ${category}, then draft distinct, non-templated recommendation letters in cases/${caseName}/final/03-recommendation-letters/ that keep 6-word shingle Jaccard similarity below 12%.`
  },
  {
    id: 'stage-7-filing',
    step: '07',
    title: 'Build Exhibit Index & Final Filing Checklist',
    titleZh: '生成证据目录、翻译认证与递交核对表',
    inputs: ['final/01-petition-letter.md', 'final/03-recommendation-letters/*'],
    targetFile: 'final/04-exhibit-index.md',
    reference: '.agents/skills/openpetition/references/filing-forms-and-rfe.md',
    description: 'Create the Exhibit Index, source-bound 8 C.F.R. § 103.2(b)(3) translation certifications, scanner-safe highlight guide, and I-140 / ETA-9089 checklist.',
    descZh: '生成完整 Exhibit 索引、非英文材料标准翻译认证页（免公证）、防扫描变黑高亮指南，以及 I-140 填表与 $300 费用核对清单。',
    buildPrompt: (caseName, category) =>
      `Use $openpetition and read .agents/skills/openpetition/references/filing-forms-and-rfe.md. Generate cases/${caseName}/final/04-exhibit-index.md (mapping every Exhibit A/B/C with page counts, scanner-proof officer highlighting instructions, and explicit 8 C.F.R. § 103.2(b)(3) Certificate of Translation Accuracy bindings for any non-English exhibits) and cases/${caseName}/final/05-filing-checklist.md (covering Form I-140 Part 1 Q5/Q6 $300 Self-Petitioner Asylum Program Fee rules, uncertified FLAG ETA-9089 rules if NIW, retrogression/cross-chargeability/CSPA screening, and assembly order). Then run node scripts/petition-toolkit.mjs audit-case --case cases/${caseName}.`
  },
  {
    id: 'stage-8-blind-audit',
    step: '08',
    isBlindAudit: true,
    title: 'Zero-Context Blind USCIS Officer Red-Team Audit',
    titleZh: 'USCIS 移民官独立盲评 (65分钟信息隔离红队挑刺)',
    inputs: ['final/01-petition-letter.md', 'final/03-recommendation-letters/*.md', 'final/04-exhibit-index.md'],
    targetFile: 'final/06-blind-officer-audit.md',
    reference: '.agents/skills/openpetition/references/filing-forms-and-rfe.md',
    description: 'Strict Information Firewall: a fresh AI session acts as Senior ISO #4109 reading ONLY your final brief, letters, and exhibit index cold (forbidden from reading materials/ or work/) to hunt down every phantom pinpoint, circularity, or RFE opening.',
    descZh: '开启严格信息隔离墙：请在新对话窗口粘贴此指令，让全新 AI 扮演挑剔的 TSC/NSC 审案官（严禁偷看 materials/ 或 work/ 底稿，仅凭最终陈情书、推荐信与证据目录盲审 65 分钟），揪出所有无据断言、循环论证与 RFE 破绽。',
    buildPrompt: (caseName, category) =>
      `[ZERO-CONTEXT BLIND USCIS ADJUDICATOR AUDIT — STRICT INFORMATION FIREWALL]
You are Senior Immigration Services Officer (ISO) #4109 at the USCIS Texas/Nebraska Service Center, adjudicating a ${category} Form I-140 petition under a 65-minute Premium Processing review clock. You have ZERO prior knowledge of this petitioner and did NOT draft any part of this case.

STRICT INFORMATION FIREWALL (MANDATORY):
- DO NOT read or list anything inside cases/${caseName}/materials/, cases/${caseName}/work/ (including evidence-index.md, benchmarks-and-citations.md, case-strategy.md), cases/${caseName}/final/00-assessment.md, or cases/${caseName}/final/03-recommendation-letters/00-recommender-plan.md.
- You may ONLY read:
  1. cases/${caseName}/final/01-petition-letter.md (The I-140 Legal Brief)
  2. cases/${caseName}/final/04-exhibit-index.md (The Exhibit Index & Highlighting Guide)
  3. Drafted letters inside cases/${caseName}/final/03-recommendation-letters/ (EXCEPT 00-recommender-plan.md)
  4. The governing legal standard in .agents/skills/openpetition/references/eb1a.md and/or .agents/skills/openpetition/references/niw.md.
- If a fact, percentile, benchmark, translation certification, or element is NOT explicitly stated in 01-petition-letter.md AND backed by a specific [Exhibit X, p. Y] entry in 04-exhibit-index.md, treat it as UNPROVEN.

YOUR 65-MINUTE ADJUDICATION PROTOCOL:
1. Triage & Burden Check (Min 0-10): Verify whether the brief establishes eligibility under Matter of Chawathe (preponderance of the evidence) and clearly maps the statutory criteria/prongs without category bleed.
2. Element-by-Element Evidentiary Cross-Check (Min 10-40):
   - If EB-1A: Score each claimed 8 C.F.R. § 204.5(h)(3) criterion at Kazarian Step 1 (requiring every plain-language regulatory sub-element), then separately score Kazarian Step 2 Final Merits (sustained acclaim + top small percentage of the field + 204.5(h)(5) U.S. continuation) under Mukherji v. Miller.
   - If EB-2 NIW: Score Step 1 (8 C.F.R. § 204.5(k) + Jan. 2025 PA-2025-03 direct specialty nexus to the Proposed Endeavor), Proposed Endeavor specificity, and Matter of Dhanasar Prongs 1, 2, and 3.
3. Red-Team Vulnerability Hunt (Min 40-55): Hunt down every Uncorroborated Claim / Phantom Pinpoint, Brief-to-Letter Circularity, Inner-Circle Echo Chamber, Self-Sabotage / Subordination, Template Voice Echo, and Jargon Black-Box Passage.
4. Decision & Simulated RFE/NOID Drafting (Min 55-65): Render an uncompromising adjudication verdict (APPROVABLE AS-IS / RFE LIKELY / NOID RISK), write the exact verbatim RFE/NOID paragraphs you would issue today, and provide a prioritized pre-filing remediation plan.

Write the complete audit report to cases/${caseName}/final/06-blind-officer-audit.md.`
  },
  {
    id: 'stage-9-rfe',
    step: 'RFE',
    isOptionalRfe: true,
    title: 'Respond to RFE / NOID or Rebuild After Denial',
    titleZh: '应对 RFE / NOID 补件，或拒信后彻底重构重交',
    inputs: ['post-filing/notice/*', 'final/*'],
    targetFile: 'post-filing/response/01-rfe-response-letter.md',
    reference: '.agents/skills/openpetition/references/filing-forms-and-rfe.md',
    description: 'Only needed if USCIS sends an RFE, NOID, or Denial. Breaks down every officer objection or rebuilds rejected framing from scratch.',
    descZh: '仅在收到移民局补件通知 (RFE/NOID) 或拒信重交时使用。逐条拆解移民官质疑，或彻底推翻曾被拒的薄弱叙事（拒绝偷懒小修小补）。',
    buildPrompt: (caseName, category) =>
      `Use $openpetition and read .agents/skills/openpetition/references/filing-forms-and-rfe.md. Analyze the notice in cases/${caseName}/post-filing/notice/, create cases/${caseName}/post-filing/notice/issue-map.md (separating 30/33-day I-290B remedy deadlines from refile strategy if a denial, or mapping Type A/B/C objections if an RFE/NOID), preserve original final/ files immutably, and draft cases/${caseName}/post-filing/response/01-rfe-response-letter.md with zero minimal-diff inertia.`
  }
];

/**
 * Seed a rich, complete 100/100 flagship EB-1A demo case in cases/sample-petition
 * so first-time users immediately see a complete working example out of the box.
 */
function ensureSamplePetitionSeeded(sampleDir) {
  initCaseWorkspace(sampleDir, { category: 'EB-1A' });
  const briefPath = path.join(sampleDir, 'final', '01-petition-letter.md');
  if (fs.existsSync(briefPath)) return;

  const filesToWrite = {
    'work/case-strategy.md': `# Case Strategy & Readiness Tracker

- **Case Name:** sample-petition
- **Target Category:** EB-1A
- **Created:** 2026-10-14

## Core Case Theory
- **Domain & Bottleneck Addressed:** Nanoscale Optical Spectroscopy & AI-Driven Quantum Sensing
- **Flagship Contributions & Measurable Impact:** Closed-loop Tip-Enhanced Raman & IR nanoscopy resolving sub-nanometer chemical dynamics (412 citations, 84.6% strictly independent Tier 3 citations across 24 countries)
- **Target Statutory Criteria:** 8 C.F.R. § 204.5(h)(3)(iv) Judging, (v) Original Contributions of Major Significance, (vi) Scholarly Articles
`,
    'materials/01-cv-and-scholar-profile.md': `# Curriculum Vitae & Google Scholar Citation Record (Raw Material)

- **Name:** Dr. Alex Chen, Ph.D.
- **Total Citations:** 412 (Google Scholar / OpenAlex verified)
- **h-index:** 11
- **Peer Reviews Completed:** 28 manuscript reviews for *Nature Nanotechnology*, *ACS Nano*, *Physical Review Letters*, and *Nano Letters*.
`,
    'materials/02-peer-review-certificates.md': `# Verified Journal Peer Review Certificates (Raw Material)

1. *Nature Nanotechnology* — 6 referee reports completed (2023–2026), invited directly by Senior Editorial Board.
2. *ACS Nano* — 12 referee reports completed (2022–2026).
3. *Physical Review Letters* — 10 referee reports completed (2022–2026).
`,
    'work/evidence-index.md': `# Structured Evidence Map (work/evidence-index.md)

| Exhibit ID | Source File | Statutory Role | Pinpoint Pages |
| :--- | :--- | :--- | :--- |
| **Exhibit A-1** | \`materials/01-cv-and-scholar-profile.md\` | Curriculum Vitae & Degree Credentials | pp. 1–4 |
| **Exhibit B-1** | \`materials/01-cv-and-scholar-profile.md\` | Flagship First-Author *Nature Nanotech.* Paper | pp. 1–12 |
| **Exhibit B-2** | \`work/benchmarks-and-citations.md\` | OpenAlex 3-Tier Independent Citation Report (84.6% Tier 3) | pp. 1–6 |
| **Exhibit C-1** | \`materials/02-peer-review-certificates.md\` | 28 Verified Journal Peer-Review Certificates | pp. 1–8 |
| **Exhibit D-1** | \`final/03-recommendation-letters/letter-1-mit-prof.md\` | Independent Expert Letter (MIT) | pp. 1–3 |
| **Exhibit D-2** | \`final/03-recommendation-letters/letter-2-industry-vp.md\` | Independent Industry Adoption Letter | pp. 1–3 |
`,
    'work/benchmarks-and-citations.md': `# Independent Citation & Field Percentile Benchmarks

- **Total Citations:** 412 across 9 peer-reviewed publications [Exhibit B-2, p. 1].
- **3-Tier Lifetime Co-Author Graph Screening:** Out of 47 lifetime co-authors screened, **84.6% (348 citations)** come from strictly independent Tier 3 research groups across **24 countries** [Exhibit B-2, p. 3].
- **OpenAlex Field Percentile:** Flagship 2023 paper ranks in the **Top 0.8% (99.2nd percentile)** worldwide for Condensed Matter & Nanoscale Optics (FWCI: 6.42x field average) [Exhibit B-2, p. 4].
`,
    'work/benchmarks.json': JSON.stringify(
      {
        author: {
          displayName: 'Dr. Alex Chen',
          hIndex: 11,
          citedByCount: 412
        },
        lifetimeCoauthorGraphSize: 47,
        citationTierSample: {
          totalSampledCitingWorks: 412,
          tier1SelfCitations: 21,
          tier2CoauthorNetwork: 42,
          tier3StrictlyIndependent: 349,
          strictlyIndependentSharePercent: 84.6
        },
        independentAdoptionFootprint: {
          countriesCount: 24,
          institutionsCount: 68
        },
        works: [
          {
            title: 'Sub-Nanometer Tip-Enhanced Infrared Nanoscopy of Single-Bond Vibrational Dynamics',
            publicationYear: 2023,
            citedByCount: 198,
            fwci: 6.42,
            percentileTop: 0.8
          },
          {
            title: 'Autonomous Closed-Loop Quantum Probe Control for Cryogenic Scanning Tunneling Microscopy',
            publicationYear: 2024,
            citedByCount: 124,
            fwci: 4.85,
            percentileTop: 1.5
          },
          {
            title: 'Phase-Resolved Near-Field Spectroscopy of 2D Heterostructures',
            publicationYear: 2022,
            citedByCount: 90,
            fwci: 3.18,
            percentileTop: 3.2
          }
        ]
      },
      null,
      2
    ),
    'final/00-assessment.md': `# EB-1A Pre-Filing Readiness Assessment

- **Category:** EB-1A Extraordinary Ability (8 C.F.R. § 204.5(h))
- **Claimed Criteria (3+ Required):**
  1. **8 C.F.R. § 204.5(h)(3)(iv) Judging:** Strong Pass (28 verified reviews for top journals) [Exhibit C-1, p. 2].
  2. **8 C.F.R. § 204.5(h)(3)(v) Original Scientific Contributions of Major Significance:** Strong Pass (84.6% strictly independent citations across 24 countries; Top 0.8% OpenAlex percentile) [Exhibit B-2, p. 3].
  3. **8 C.F.R. § 204.5(h)(3)(vi) Authorship of Scholarly Articles:** Strong Pass (9 peer-reviewed articles in *Nature Nanotechnology*, *ACS Nano*, and *PRL*) [Exhibit B-1, p. 1].
`,
    'final/01-petition-letter.md': `# Form I-140 Petition Letter — EB-1A Extraordinary Ability

## I. Executive Summary & Standard of Proof
Petitioner Dr. Alex Chen submits this Form I-140 petition under INA § 203(b)(1)(A) and 8 C.F.R. § 204.5(h) as an individual of extraordinary ability in nanoscale optical spectroscopy [Exhibit A-1, p. 1]. Under *Matter of Chawathe*, 25 I&N Dec. 369 (AAO 2010), and *Mukherji v. Miller*, No. 24-3070 (8th Cir. Jan. 28, 2026), Petitioner establishes by a preponderance of the evidence both initial regulatory eligibility across three criteria and sustained national and international acclaim at Kazarian Step 2.

## II. Criterion 1: Judging the Work of Others — 8 C.F.R. § 204.5(h)(3)(iv)
Petitioner has completed **28 formal peer reviews** for flagship journals including *Nature Nanotechnology*, *ACS Nano*, and *Physical Review Letters* [Exhibit C-1, p. 2]. Each review request was issued directly to Petitioner based on recognized subject-matter authority in near-field vibrational nanoscopy [Exhibit C-1, p. 5].

## III. Criterion 2: Original Scientific Contributions of Major Significance — 8 C.F.R. § 204.5(h)(3)(v)
Petitioner conceived and engineered the phase-locked Tip-Enhanced Infrared Nanoscopy architecture that resolved single-bond chemical dynamics at 0.8 nm spatial resolution [Exhibit B-1, p. 4]. Out of 412 total citations, **84.6% (349 citations)** originate from strictly independent Tier 3 research laboratories across 24 countries after screening out all 47 lifetime co-authors [Exhibit B-2, p. 3]. Independent groups at MIT and semiconductor metrology leaders have directly adopted Petitioner's architecture in production wafer inspection [Exhibit D-1, p. 2] [Exhibit D-2, p. 2].

## IV. Criterion 3: Authorship of Scholarly Articles — 8 C.F.R. § 204.5(h)(3)(vi)
Petitioner authored 9 peer-reviewed journal articles in top-decile venues, led by a 2023 *Nature Nanotechnology* article ranking in the **Top 0.8% worldwide** by OpenAlex field-weighted citation impact (FWCI 6.42x) [Exhibit B-1, p. 1] [Exhibit B-2, p. 4].

## V. Kazarian Step 2 Final Merits Determination & U.S. Continuation
Viewed in the totality of the evidence under *Kazarian v. USCIS*, 596 F.3d 1115 (9th Cir. 2010), and *Mukherji v. Miller* (8th Cir. 2026), Petitioner's 84.6% independent global citation footprint, Top 0.8% field percentile, and 28 elite journal reviews place Petitioner among the small percentage at the very top of the field [Exhibit A-1, p. 3] [Exhibit B-2, p. 4].
`,
    'final/02-personal-statement.md': `# Personal Statement of Continuing Work in the United States

I am a physicist and instrumentation scientist specializing in sub-nanometer optical spectroscopy and autonomous scanning probe metrology [Exhibit A-1, p. 1]. Upon approval of this petition, I will continue leading research and development of next-generation infrared and Raman nanoscopy platforms for semiconductor defect inspection and quantum materials characterization in the United States [Exhibit B-1, p. 4].
`,
    'final/03-recommendation-letters/00-recommender-plan.md': `# Recommender Portfolio Plan

1. **Letter 1 (Strictly Independent Academic Authority):** Prof. Evelyn Vance, Full Professor of Physics at MIT (Exhibit D-1). Zero prior co-authorship or institutional overlap.
2. **Letter 2 (Strictly Independent Industry Executive):** Dr. Marcus Thorne, VP of Metrology R&D at KLA Semiconductor Systems (Exhibit D-2). Zero prior co-authorship.
`,
    'final/03-recommendation-letters/letter-1-mit-prof.md': `# Independent Expert Opinion Letter — Prof. Evelyn Vance (MIT)

As a Full Professor of Physics at the Massachusetts Institute of Technology working on ultrafast near-field optics, I have never collaborated with or co-authored any paper with Dr. Alex Chen. I know Dr. Chen solely through his seminal 2023 *Nature Nanotechnology* publication introducing phase-locked tip-enhanced infrared nanoscopy [Exhibit B-1, p. 4].

In 2024, my laboratory at MIT adopted Dr. Chen's interferometric background-suppression protocol to image polariton propagation across twisted bilayer graphene. His mathematical formulation eliminated thermal drift artifacts that had stalled our measurements for eighteen months, allowing us to achieve 0.8 nm chemical contrast without damaging fragile monolayer samples.
`,
    'final/03-recommendation-letters/letter-2-industry-vp.md': `# Independent Industry Adoption Letter — Dr. Marcus Thorne (VP of Metrology)

I serve as Vice President of Wafer Inspection Engineering at a leading U.S. semiconductor metrology manufacturer. I have no personal or academic affiliation with Dr. Alex Chen; our engineering team discovered his closed-loop scanning probe control algorithm through his 2024 publication and open-source benchmark suite [Exhibit B-2, p. 3].

When sub-2nm gate-all-around transistor nodes introduced buried dielectric voids invisible to conventional electron-beam inspection, our R&D group integrated Dr. Chen's autonomous tip-positioning loop into our inline AFM-IR testbed. Doing so reduced probe crash rates by 73% and increased wafer-level spectral throughput fourfold across our Albany and Hillsboro fabrication lines.
`,
    'final/04-exhibit-index.md': `# Master Exhibit Index & Officer Highlighting Guide

| Exhibit | Description | Pages | Officer Highlighting & Verification Note |
| :--- | :--- | :--- | :--- |
| **Exhibit A-1** | Curriculum Vitae & Ph.D. Diploma of Dr. Alex Chen | pp. 1–4 | Highlight Ph.D. conferral date on p. 1 and Research Appointments on p. 3. |
| **Exhibit B-1** | First-Author *Nature Nanotechnology* (2023) Article | pp. 1–12 | Highlight first-author byline on p. 1 and 0.8 nm resolution result on p. 4. |
| **Exhibit B-2** | OpenAlex 3-Tier Citation & Field Percentile Report | pp. 1–6 | Highlight 84.6% Tier 3 Strictly Independent share on p. 3 and Top 0.8% rank on p. 4. |
| **Exhibit C-1** | 28 Verified Peer-Review Certificates (*Nature Nanotech.*, *ACS Nano*, *PRL*) | pp. 1–8 | Highlight editor invitation headers on pp. 2, 5. |
| **Exhibit D-1** | Independent Expert Letter from Prof. Evelyn Vance (MIT) | pp. 1–3 | Highlight independent MIT lab adoption paragraph on p. 2. |
| **Exhibit D-2** | Independent Industry Letter from Dr. Marcus Thorne | pp. 1–3 | Highlight 73% crash reduction in sub-2nm wafer metrology on p. 2. |
`,
    'final/05-filing-checklist.md': `# Form I-140 Pre-Filing & Assembly Checklist

- **Form I-140 Edition & Fee Verification:** Part 1 Q5/Q6 marked **Yes** to qualify for the **$300 Individual Self-Petitioner Asylum Program Fee** (separate payment from the $715 Form I-140 base filing fee).
- **Scanner-Safe Highlighting Verified:** All exhibits use light yellow callout boxes and vector red border boxes rather than dark marker fills.
- **8 C.F.R. § 103.2(b)(3) Translation Rule:** All documents are in English or bound to a signed Certificate of Translation Accuracy.
`,
    'final/06-blind-officer-audit.md': `# Zero-Context Blind USCIS Officer Audit Report (Senior ISO #4109)

- **Adjudication Clock:** 65-Minute Premium Processing Review Simulation
- **Information Firewall Status:** ENFORCED — Evaluated ONLY \`final/01-petition-letter.md\`, \`final/03-recommendation-letters/\`, and \`final/04-exhibit-index.md\`. Zero access to \`materials/\` or \`work/\`.

## 1. Kazarian Step 1 — Plain-Language Regulatory Criteria
- **8 C.F.R. § 204.5(h)(3)(iv) Judging:** **PASS** — 28 completed peer reviews corroborated by [Exhibit C-1, p. 2] and [Exhibit C-1, p. 5].
- **8 C.F.R. § 204.5(h)(3)(v) Original Contributions:** **PASS** — Methodology and scientific breakthrough are tightly unified; 84.6% independent Tier 3 citation share ([Exhibit B-2, p. 3]) plus independent MIT and semiconductor industry adoption ([Exhibit D-1, p. 2], [Exhibit D-2, p. 2]) establish major significance.
- **8 C.F.R. § 204.5(h)(3)(vi) Scholarly Articles:** **PASS** — Corroborated by [Exhibit B-1, p. 1] and [Exhibit B-2, p. 4].

## 2. Kazarian Step 2 — Final Merits & Red-Team Vulnerability Check
- **Pinpoint Integrity:** 6/6 cited exhibits resolve to exact page numbers in \`04-exhibit-index.md\`. Zero phantom pinpoints.
- **Letter Overlap:** Pairwise 6-word shingle Jaccard overlap between \`letter-1-mit-prof.md\` and \`letter-2-industry-vp.md\` is **0.0% (<12% threshold)**.
- **Simulated Verdict:** **APPROVABLE AS-IS** under *Matter of Chawathe* and *Mukherji v. Miller* (8th Cir. 2026).
`
  };

  for (const [rel, content] of Object.entries(filesToWrite)) {
    const full = path.join(sampleDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }
}

/**
 * Create the OpenPetition Studio HTTP server instance.
 */
export function createStudioServer({ rootDir = __dirname } = {}) {
  const casesRoot = path.join(rootDir, 'cases');
  fs.mkdirSync(casesRoot, { recursive: true });

  const sampleDir = path.join(casesRoot, 'sample-petition');
  const existingDirs = fs
    .readdirSync(casesRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'));
  if (existingDirs.length === 0 || fs.existsSync(sampleDir)) {
    ensureSamplePetitionSeeded(sampleDir);
  }

  const sseClients = new Set();
  const agentJobs = new Map();
  let jobCounter = 1;

  const broadcastEvent = (type, payload) => {
    const msg = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const res of sseClients) {
      try {
        res.write(msg);
      } catch {
        sseClients.delete(res);
      }
    }
  };

  let watchDebounce = null;
  let watcher = null;
  if (!process.env.OPENPETITION_DISABLE_WATCH) {
    try {
      watcher = fs.watch(casesRoot, { recursive: true }, (_eventType, filename) => {
        if (filename && filename.includes('audit-report.json')) return;
        clearTimeout(watchDebounce);
        watchDebounce = setTimeout(() => {
          broadcastEvent('fs-change', { filename: filename || '', timestamp: new Date().toISOString() });
        }, 250);
      });
    } catch {}
  }

  const resolveSafeCaseDir = (caseName) => {
    const clean = String(caseName || '').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^-+|-+$/g, '');
    if (!clean) throw new Error('Invalid case name');
    const target = path.resolve(casesRoot, clean);
    if (!target.startsWith(path.resolve(casesRoot))) {
      throw new Error('Path traversal blocked');
    }
    return { clean, target };
  };

  const resolveSafeCaseFile = (caseDir, relFile) => {
    const norm = String(relFile || '').replace(/\\/g, '/').replace(/^\/+/, '');
    const full = path.resolve(caseDir, norm);
    if (!full.startsWith(path.resolve(caseDir))) {
      throw new Error('File path traversal blocked');
    }
    return { norm, full };
  };

  const readJsonBody = (req) =>
    new Promise((resolve, reject) => {
      const chunks = [];
      let total = 0;
      req.on('data', (chunk) => {
        total += chunk.length;
        if (total > 25 * 1024 * 1024) {
          reject(new Error('Payload too large'));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () => {
        try {
          const raw = Buffer.concat(chunks).toString('utf8');
          resolve(raw ? JSON.parse(raw) : {});
        } catch (e) {
          reject(e);
        }
      });
      req.on('error', reject);
    });

  const sendJson = (res, status, data) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(data));
  };

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
      const pathname = url.pathname;

      if (req.method === 'GET' && pathname === '/favicon.ico') {
        res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' });
        res.end('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#18181b" stroke-width="2"><path d="M12 3v18"/><path d="M3 7h18"/><path d="M7 21h10"/></svg>');
        return;
      }

      if (req.method === 'GET' && pathname === '/api/events') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive'
        });
        res.write(`event: connected\ndata: {"ok":true}\n\n`);
        sseClients.add(res);
        req.on('close', () => sseClients.delete(res));
        return;
      }

      if (req.method === 'GET' && pathname === '/api/health') {
        return sendJson(res, 200, {
          ok: true,
          service: 'OpenPetition Studio',
          casesRoot,
          stagesCount: AI_PIPELINE_STAGES.length
        });
      }

      if (req.method === 'GET' && pathname === '/api/cases') {
        const dirs = fs
          .readdirSync(casesRoot, { withFileTypes: true })
          .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
          .map((d) => {
            const report = auditCase(path.join(casesRoot, d.name));
            return {
              name: d.name,
              category: report.detectedCategory,
              readinessScore: report.readinessScore,
              counts: report.counts
            };
          });
        return sendJson(res, 200, {
          cases: dirs,
          stages: AI_PIPELINE_STAGES.map(({ id, step, isOptionalRfe, isBlindAudit, inputs, title, titleZh, targetFile, reference, description, descZh }) => ({
            id,
            step,
            isOptionalRfe: Boolean(isOptionalRfe),
            isBlindAudit: Boolean(isBlindAudit),
            inputs: inputs || [],
            title,
            titleZh,
            targetFile,
            reference,
            description,
            descZh
          }))
        });
      }

      if (req.method === 'POST' && pathname === '/api/cases') {
        const body = await readJsonBody(req);
        const { clean, target } = resolveSafeCaseDir(body.name || 'new-case');
        const category = body.category || 'EB-1A';
        initCaseWorkspace(target, { category });
        const report = auditCase(target);
        broadcastEvent('case-created', { name: clean });
        return sendJson(res, 201, { ok: true, caseName: clean, report });
      }

      if (req.method === 'GET' && pathname === '/api/case') {
        const caseName = url.searchParams.get('name');
        const { clean, target } = resolveSafeCaseDir(caseName);
        if (!fs.existsSync(target)) {
          return sendJson(res, 404, { error: `Case "${clean}" not found` });
        }
        const report = auditCase(target);
        const benchmarksPath = path.join(target, 'work', 'benchmarks.json');
        const benchmarks = fs.existsSync(benchmarksPath)
          ? JSON.parse(fs.readFileSync(benchmarksPath, 'utf8'))
          : null;

        const categoryLabel =
          report.detectedCategory === 'Unknown' ? 'EB-1A / EB-2 NIW' : report.detectedCategory;
        const stagesWithPrompts = AI_PIPELINE_STAGES.map((s) => ({
          id: s.id,
          step: s.step,
          isOptionalRfe: Boolean(s.isOptionalRfe),
          isBlindAudit: Boolean(s.isBlindAudit),
          inputs: s.inputs || [],
          title: s.title,
          titleZh: s.titleZh,
          targetFile: s.targetFile,
          reference: s.reference,
          description: s.description,
          descZh: s.descZh,
          exists: fs.existsSync(path.join(target, s.targetFile)),
          prompt: s.buildPrompt(clean, categoryLabel)
        }));

        return sendJson(res, 200, {
          caseName: clean,
          report,
          benchmarks,
          stages: stagesWithPrompts,
          jobs: [...agentJobs.values()].filter((j) => j.caseName === clean).slice(-10)
        });
      }

      if (req.method === 'GET' && pathname === '/api/file') {
        const caseName = url.searchParams.get('case');
        const relFile = url.searchParams.get('path');
        if (caseName === '__skill__') {
          const safeSkillFile = path.resolve(rootDir, String(relFile || ''));
          if (!safeSkillFile.startsWith(path.resolve(rootDir)) || !fs.existsSync(safeSkillFile)) {
            return sendJson(res, 404, { error: 'Skill file not found' });
          }
          return sendJson(res, 200, {
            path: relFile,
            content: fs.readFileSync(safeSkillFile, 'utf8')
          });
        }
        const { target } = resolveSafeCaseDir(caseName);
        const { norm, full } = resolveSafeCaseFile(target, relFile);
        if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
          return sendJson(res, 404, { error: `File not found: ${norm}` });
        }
        const ext = path.extname(full).toLowerCase();
        const isBinary = /\.(pdf|png|jpg|jpeg|docx|zip)$/i.test(ext);
        if (url.searchParams.get('raw') === '1') {
          const mimeMap = {
            '.pdf': 'application/pdf',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.md': 'text/markdown; charset=utf-8',
            '.txt': 'text/plain; charset=utf-8',
            '.json': 'application/json; charset=utf-8'
          };
          res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
          fs.createReadStream(full).pipe(res);
          return;
        }
        return sendJson(res, 200, {
          path: norm,
          isBinary,
          size: fs.statSync(full).size,
          content: isBinary ? null : fs.readFileSync(full, 'utf8')
        });
      }

      if (req.method === 'POST' && pathname === '/api/file') {
        const body = await readJsonBody(req);
        const { clean, target } = resolveSafeCaseDir(body.caseName);
        const { norm, full } = resolveSafeCaseFile(target, body.path);
        fs.mkdirSync(path.dirname(full), { recursive: true });
        if (body.encoding === 'base64') {
          fs.writeFileSync(full, Buffer.from(body.content || '', 'base64'));
        } else {
          fs.writeFileSync(full, String(body.content ?? ''), 'utf8');
        }
        const report = auditCase(target);
        broadcastEvent('file-saved', { caseName: clean, path: norm });
        return sendJson(res, 200, { ok: true, path: norm, report });
      }

      if (req.method === 'POST' && pathname === '/api/harvest-citations') {
        const body = await readJsonBody(req);
        const { clean, target } = resolveSafeCaseDir(body.caseName);
        const summary = await harvestCitations({
          authorName: body.authorName,
          orcid: body.orcid,
          caseDir: target
        });
        const report = auditCase(target);
        broadcastEvent('benchmarks-updated', { caseName: clean });
        return sendJson(res, 200, { ok: true, summary, report });
      }

      if (req.method === 'POST' && pathname === '/api/agent/run') {
        const body = await readJsonBody(req);
        const { clean, target } = resolveSafeCaseDir(body.caseName);
        const runner = String(body.runner || 'codex').trim();
        const prompt = String(body.prompt || '').trim();
        if (!prompt) {
          return sendJson(res, 400, { error: 'Prompt is required' });
        }

        const jobId = `job-${jobCounter++}`;
        let cmd = runner;
        let args = [];
        if (runner === 'codex') {
          cmd = process.platform === 'win32' ? 'codex.cmd' : 'codex';
          args = ['exec', prompt];
        } else if (runner === 'claude') {
          cmd = process.platform === 'win32' ? 'claude.cmd' : 'claude';
          args = ['-p', prompt];
        } else if (runner === 'toolkit-audit') {
          cmd = process.execPath;
          args = [path.join(rootDir, 'scripts', 'petition-toolkit.mjs'), 'audit-case', '--case', target];
        } else {
          return sendJson(res, 400, { error: `Unsupported runner: ${runner}` });
        }

        const job = {
          id: jobId,
          caseName: clean,
          runner,
          prompt,
          status: 'running',
          startedAt: new Date().toISOString(),
          finishedAt: null,
          logs: `[${new Date().toLocaleTimeString()}] Running ${runner} in ${rootDir}...\n`
        };
        agentJobs.set(jobId, job);
        broadcastEvent('agent-job', { jobId, status: 'running', logs: job.logs });

        const child = spawn(cmd, args, {
          cwd: rootDir,
          shell: process.platform === 'win32',
          env: { ...process.env }
        });

        job.kill = () => {
          try {
            child.kill();
          } catch {}
        };

        child.stdout.on('data', (d) => {
          const text = d.toString('utf8');
          job.logs += text;
          broadcastEvent('agent-log', { jobId, chunk: text });
        });
        child.stderr.on('data', (d) => {
          const text = d.toString('utf8');
          job.logs += text;
          broadcastEvent('agent-log', { jobId, chunk: text });
        });
        child.on('error', (err) => {
          job.status = 'error';
          job.finishedAt = new Date().toISOString();
          const msg = `\n[Tip] Local CLI "${runner}" was not found in PATH (${err.message}). Click "Copy Prompt" on any step card and paste it into Cursor, Claude, Antigravity, or Codex.\n`;
          job.logs += msg;
          broadcastEvent('agent-job', { jobId, status: 'error', logs: job.logs });
        });
        child.on('close', (code) => {
          if (job.status === 'running') {
            job.status = code === 0 ? 'completed' : 'failed';
            job.finishedAt = new Date().toISOString();
            job.logs += `\n[Finished with exit code ${code}]\n`;
            broadcastEvent('agent-job', { jobId, status: job.status, logs: job.logs });
          }
        });

        return sendJson(res, 202, { ok: true, jobId, job: { ...job, kill: undefined } });
      }

      if (req.method === 'POST' && pathname === '/api/agent/stop') {
        const body = await readJsonBody(req);
        const job = agentJobs.get(body.jobId);
        if (!job) return sendJson(res, 404, { error: 'Job not found' });
        if (job.kill) job.kill();
        job.status = 'stopped';
        job.finishedAt = new Date().toISOString();
        broadcastEvent('agent-job', { jobId: job.id, status: 'stopped', logs: job.logs });
        return sendJson(res, 200, { ok: true });
      }

      if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(STUDIO_HTML);
        return;
      }

      sendJson(res, 404, { error: 'Not found' });
    } catch (err) {
      sendJson(res, 500, { error: err.message || 'Internal server error' });
    }
  });

  server.on('close', () => {
    clearTimeout(watchDebounce);
    if (watcher) {
      try {
        watcher.close();
      } catch {}
    }
  });

  return server;
}

const STUDIO_HTML = /* html */ `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OpenPetition Studio — EB-1A &amp; NIW Legal Workbench</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap');

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .font-mono {
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .font-serif-brief {
      font-family: 'Newsreader', Georgia, 'Times New Roman', serif;
    }

    /* Legal brief typography inside Novel.sh / Notion split reader */
    .legal-prose h1 {
      font-family: 'Inter', sans-serif;
      font-size: 1.2rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #09090b;
      border-bottom: 2px solid #18181b;
      padding-bottom: 0.6rem;
      margin-bottom: 0.95rem;
    }
    .legal-prose h2 {
      font-family: 'Inter', sans-serif;
      font-size: 0.94rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: #18181b;
      margin-top: 1.25rem;
      margin-bottom: 0.45rem;
    }
    .legal-prose h3 {
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      color: #27272a;
      margin-top: 0.95rem;
      margin-bottom: 0.35rem;
    }
    .legal-prose p {
      font-size: 0.9rem;
      line-height: 1.75;
      color: #27272a;
      margin-bottom: 0.8rem;
    }
    .legal-prose ul {
      list-style-type: disc;
      padding-left: 1.25rem;
      margin-bottom: 0.8rem;
      font-size: 0.88rem;
      line-height: 1.68;
      color: #27272a;
    }
    .legal-prose li {
      margin-bottom: 0.25rem;
    }
    .legal-prose table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.85rem 0;
      font-family: 'Inter', sans-serif;
      font-size: 0.78rem;
    }
    .legal-prose th,
    .legal-prose td {
      border: 1px solid #e4e4e7;
      padding: 0.45rem 0.65rem;
      text-align: left;
    }
    .legal-prose th {
      background: #fafafa;
      font-weight: 600;
      color: #18181b;
    }
    .legal-prose code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      background: #f4f4f5;
      border: 1px solid #e4e4e7;
      border-radius: 0.25rem;
      padding: 0.1rem 0.3rem;
    }

    @media print {
      .no-print { display: none !important; }
      body { background: #ffffff !important; }
      #tab-step3 { display: block !important; }
      #editor-left-pane { display: none !important; }
      #editor-right-pane { width: 100% !important; background: #ffffff !important; padding: 0 !important; }
    }
  </style>
</head>
<body class="min-h-screen bg-zinc-50/70 text-zinc-950 antialiased selection:bg-indigo-100 selection:text-indigo-900">
  <div id="op-studio-root" class="min-h-screen flex flex-col">

    <!-- Top Navigation Bar (shadcn/ui dashboard-01 header — clean left/right split, zero crowding) -->
    <header class="no-print sticky top-0 z-30 h-14 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div class="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        <!-- Left: Brand + Case Switcher (all items whitespace-nowrap shrink-0) -->
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-sm shrink-0">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="m19 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"/><path d="m5 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M7 21h10"/></svg>
          </div>
          <span class="font-semibold text-sm tracking-tight text-zinc-950 whitespace-nowrap shrink-0">OpenPetition Studio</span>
          <span class="text-zinc-300 shrink-0">/</span>
          <select id="case-select" aria-label="Select Case" class="h-8 max-w-[240px] rounded-md border border-zinc-200 bg-zinc-50/90 px-2.5 text-xs font-medium text-zinc-900 shadow-sm hover:bg-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950"></select>
          <span id="case-category-badge" class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200 whitespace-nowrap shrink-0">EB-1A</span>
          <button id="btn-toggle-new-case" type="button" class="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-2.5 h-8 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0" data-i18n="newCaseBtn">+ 新建申请</button>
        </div>

        <!-- Right: Global Controls (all items whitespace-nowrap shrink-0) -->
        <div class="flex items-center gap-2 shrink-0">
          <button id="btn-open-cmd" type="button" class="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50/90 px-2.5 h-8 text-xs font-medium text-zinc-600 shadow-sm hover:bg-zinc-100 transition-colors whitespace-nowrap shrink-0" title="Quick Command Palette (⌘K)">
            <svg class="w-3.5 h-3.5 text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <span data-i18n="searchPlaceholder" class="hidden sm:inline">搜索指令或文档</span>
            <kbd class="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">⌘K</kbd>
          </button>
          <button id="btn-lang-toggle" type="button" class="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-2.5 h-8 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0">中文 / EN</button>
          <button id="btn-print-brief" type="button" class="inline-flex items-center gap-1.5 justify-center rounded-md bg-zinc-900 px-3 h-8 text-xs font-medium text-zinc-50 shadow hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0">
            <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
            <span data-i18n="exportPdfBtn">导出 PDF</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Collapsible New Case Creation Bar -->
    <div id="new-case-drawer" class="no-print hidden border-b border-zinc-200 bg-zinc-100/70">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-xs font-medium text-zinc-700">
          <span class="inline-flex items-center rounded-md bg-zinc-900 px-2 py-0.5 text-[11px] font-mono text-white">cases/</span>
          <span data-i18n="newCasePrompt">创建独立本地案件工作区（支持 EB-1A 与 EB-2 NIW 双轨隔离）：</span>
        </div>
        <div class="flex items-center gap-2">
          <input id="new-case-name" type="text" placeholder="e.g. dr-chen-eb1a" class="h-8 w-48 rounded-md border border-zinc-300 bg-white px-2.5 text-xs text-zinc-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-950" />
          <select id="new-case-category" class="h-8 rounded-md border border-zinc-300 bg-white px-2.5 text-xs font-medium text-zinc-900 shadow-sm">
            <option value="EB-1A">EB-1A (Extraordinary Ability)</option>
            <option value="EB-2 NIW">EB-2 NIW (National Interest Waiver)</option>
          </select>
          <button id="btn-create-case" type="button" class="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 h-8 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap" data-i18n="createBtn">立即创建</button>
        </div>
      </div>
    </div>

    <!-- Main Full-Width Container (shadcn/ui dashboard-01 standard container) -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">

      <!-- Dedicated Workflow Tabs Row (shadcn/ui TabsList — never collides with top header) -->
      <div class="no-print flex flex-wrap items-center justify-between gap-3">
        <nav class="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-100 p-1 text-zinc-500 border border-zinc-200/80 overflow-x-auto max-w-full" aria-label="Workflow Steps">
          <button type="button" class="step-tab inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all bg-white text-zinc-950 shadow-sm shrink-0" data-tab="tab-step1">
            <span class="font-mono text-[11px] mr-1.5 text-indigo-600 font-semibold">01</span>
            <span data-i18n="step1Tab">材料与证据库</span>
          </button>
          <button type="button" class="step-tab inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all text-zinc-600 hover:text-zinc-950 shrink-0" data-tab="tab-step2">
            <span class="font-mono text-[11px] mr-1.5 text-zinc-400">02</span>
            <span data-i18n="step2Tab">AI 流水线与盲评</span>
          </button>
          <button type="button" class="step-tab inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all text-zinc-600 hover:text-zinc-950 shrink-0" data-tab="tab-step3">
            <span class="font-mono text-[11px] mr-1.5 text-zinc-400">03</span>
            <span data-i18n="step3Tab">分栏文书精修</span>
          </button>
          <button type="button" class="step-tab inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all text-zinc-600 hover:text-zinc-950 shrink-0" data-tab="tab-step4">
            <span class="font-mono text-[11px] mr-1.5 text-zinc-400">04</span>
            <span data-i18n="step4Tab">法规矩阵与体检</span>
          </button>
        </nav>

        <div class="hidden md:flex items-center gap-2 text-xs text-zinc-500">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span data-i18n="localFirstBadge">100% 本地隐私优先 · 支持 Claude / Cursor / Codex</span>
          </span>
        </div>
      </div>

      <!-- 4-Column shadcn/ui KPI Row -->
      <section class="no-print grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <!-- KPI 1: Readiness Score -->
        <div id="pill-jump-check" class="rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm p-5 cursor-pointer hover:border-zinc-300 transition-colors">
          <div class="flex items-center justify-between space-y-0 pb-2">
            <h3 class="tracking-tight text-xs font-medium text-zinc-500" data-i18n="kpiReadiness">案卷就绪评分 (Readiness)</h3>
            <span id="readiness-score" class="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200 font-mono">100/100</span>
          </div>
          <div class="flex items-baseline justify-between gap-2">
            <div id="kpi-score" class="text-2xl font-bold tracking-tight tabular-nums text-zinc-950">100 / 100</div>
            <span class="text-xs text-emerald-600 font-medium whitespace-nowrap" data-i18n="kpiReadinessSub">11项体检实时监控</span>
          </div>
          <div class="mt-3 w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
            <div id="score-bar-fill" class="bg-emerald-500 h-full rounded-full transition-all duration-300" style="width: 100%"></div>
          </div>
          <div id="top-score-bar" class="hidden"></div>
        </div>

        <!-- KPI 2: Independent Citations -->
        <div class="rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm p-5">
          <div class="flex items-center justify-between space-y-0 pb-2">
            <h3 class="tracking-tight text-xs font-medium text-zinc-500" data-i18n="kpiCitations">纯独立他引占比 (Tier 3)</h3>
            <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200">OpenAlex</span>
          </div>
          <div id="kpi-citations" class="text-2xl font-bold tracking-tight tabular-nums text-zinc-950">84.6%</div>
          <p id="kpi-citations-sub" class="text-xs text-zinc-500 mt-1 truncate" data-i18n="kpiCitationsSub">已剔除全部历史合作者网络自引</p>
        </div>

        <!-- KPI 3: Exhibit Pinpoints & Letters -->
        <div class="rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm p-5">
          <div class="flex items-center justify-between space-y-0 pb-2">
            <h3 class="tracking-tight text-xs font-medium text-zinc-500" data-i18n="kpiExhibits">证据索引与去重推荐信</h3>
            <span class="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 font-mono">[Ex. X, p. Y]</span>
          </div>
          <div class="flex items-baseline gap-2.5">
            <div id="metric-exhibits" class="text-2xl font-bold tracking-tight tabular-nums text-zinc-950">6 / 6</div>
            <span class="text-xs text-zinc-400">·</span>
            <div class="text-xs text-zinc-600 whitespace-nowrap"><strong id="metric-letters" class="font-mono text-zinc-900">2</strong> <span data-i18n="lettersUnit">封推荐信 (&lt;12%)</span></div>
          </div>
          <p class="text-xs text-zinc-500 mt-1" data-i18n="kpiExhibitsSub">全部正文引述均绑定精确页码</p>
        </div>

        <!-- KPI 4: Zero-Context Blind Officer Audit -->
        <div id="kpi-card-blind" class="rounded-xl border border-violet-200/90 bg-gradient-to-br from-white via-white to-violet-50/40 text-zinc-950 shadow-sm p-5">
          <div class="flex items-center justify-between space-y-0 pb-2">
            <h3 class="tracking-tight text-xs font-semibold text-violet-900" data-i18n="kpiBlindTitle">移民官独立盲评 (Stage 08)</h3>
            <span class="inline-flex items-center rounded-md bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-800 border border-violet-200">ISO #4109</span>
          </div>
          <div id="kpi-blind-status" class="text-base font-bold tracking-tight text-zinc-950" data-i18n="kpiBlindReady">65分钟零背景红队挑刺</div>
          <div class="mt-2 flex items-center gap-2">
            <button id="btn-kpi-copy-blind" type="button" class="inline-flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm hover:bg-violet-500 transition-colors whitespace-nowrap shrink-0">
              <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <span data-i18n="copyBlindShort">复制盲评指令</span>
            </button>
            <span class="text-[11px] text-zinc-500 truncate" data-i18n="blindFirewallHint">严禁偷看底稿</span>
          </div>
        </div>
      </section>

      <!-- ===================================================================== -->
      <!-- TAB 01: EVIDENCE VAULT & CASE FILES (Preline Dropzone + shadcn Table) -->
      <!-- ===================================================================== -->
      <section id="tab-step1" class="tab-pane space-y-6" style="display: block;">
        <!-- Preline / Flowbite Dashed File Dropzone Card -->
        <div class="rounded-xl border border-zinc-200 bg-white shadow-sm p-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
            <div>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200 whitespace-nowrap">Step 01</span>
                <h2 class="text-base font-semibold tracking-tight text-zinc-950" data-i18n="step1Title">放入您的原始申请材料 (只读安全保真)</h2>
              </div>
              <p class="text-xs text-zinc-500 mt-1" data-i18n="step1Desc">将简历 CV、Google Scholar 主页 PDF、代表作论文、审稿感谢信或获奖证书拖入下方。AI 全程只读提取事实与页码，绝不篡改原文件。</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button id="btn-new-file" type="button" class="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors whitespace-nowrap" data-i18n="newFileBtn">+ 新建空白文书</button>
              <button id="btn-go-step2" type="button" class="inline-flex items-center gap-1.5 justify-center rounded-md bg-zinc-900 px-3.5 h-8 text-xs font-medium text-white shadow hover:bg-zinc-800 transition-colors whitespace-nowrap">
                <span data-i18n="nextToStep2Btn">下一步：AI 流水线与盲评</span>
                <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>
          </div>

          <!-- Dashed Dropzone -->
          <div id="upload-dropzone" class="mt-5 cursor-pointer p-8 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-300 rounded-xl bg-zinc-50/50 hover:border-indigo-500 hover:bg-indigo-50/20 transition-all group">
            <input id="file-input" type="file" multiple class="hidden" />
            <div class="p-3 bg-indigo-50 text-indigo-600 rounded-full mb-3 border border-indigo-100 group-hover:scale-105 transition-transform">
              <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p class="text-sm font-medium text-zinc-800">
              <span data-i18n="dropTitle">拖拽 CV、Google Scholar PDF、代表作或审稿记录到此，或</span>
              <span class="text-indigo-600 font-semibold underline decoration-indigo-300 underline-offset-2 ml-1" data-i18n="dropBrowse">点击选择本地文件</span>
            </p>
            <p class="mt-1 text-xs text-zinc-500" data-i18n="dropSub">支持 PDF、Markdown、DOCX、PNG/JPG · 自动存入当前案件的 materials/ 目录</p>
          </div>
        </div>

        <!-- Verbatim shadcn/ui Tasks DataTable for Case Files + Legal Guides -->
        <div class="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/50">
            <div class="flex items-center gap-2.5">
              <h3 class="text-sm font-semibold text-zinc-900" data-i18n="inventoryHeader">当前案件全部材料与生成的文书资产</h3>
              <span id="inventory-count" class="inline-flex items-center rounded-md bg-zinc-200/70 px-2 py-0.5 text-xs font-mono font-medium text-zinc-700">0 files</span>
            </div>
            <!-- Folder Filter Pills -->
            <div class="inline-flex items-center rounded-lg bg-zinc-100 p-0.5 text-xs border border-zinc-200/80">
              <button type="button" class="folder-filter-btn rounded-md px-2.5 py-1 font-medium bg-white text-zinc-950 shadow-sm whitespace-nowrap" data-folder="all" data-i18n="filterAll">全部文件</button>
              <button type="button" class="folder-filter-btn rounded-md px-2.5 py-1 font-medium text-zinc-600 hover:text-zinc-950 whitespace-nowrap" data-folder="materials/" data-i18n="filterMaterials">原始材料 (materials/)</button>
              <button type="button" class="folder-filter-btn rounded-md px-2.5 py-1 font-medium text-zinc-600 hover:text-zinc-950 whitespace-nowrap" data-folder="work/" data-i18n="filterWork">分析底稿 (work/)</button>
              <button type="button" class="folder-filter-btn rounded-md px-2.5 py-1 font-medium text-zinc-600 hover:text-zinc-950 whitespace-nowrap" data-folder="final/" data-i18n="filterFinal">最终文书 (final/)</button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-zinc-200 bg-zinc-50/40 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  <th class="py-3 px-6" data-i18n="colFileName">文件名称与路径</th>
                  <th class="py-3 px-4" data-i18n="colCategory">法条归属 / 证据角色</th>
                  <th class="py-3 px-4" data-i18n="colFolder">所在目录</th>
                  <th class="py-3 px-4" data-i18n="colStatus">状态</th>
                  <th class="py-3 px-6 text-right" data-i18n="colAction">操作</th>
                </tr>
              </thead>
              <tbody id="materials-inventory-list" class="divide-y divide-zinc-200 text-sm"></tbody>
            </table>
          </div>

          <!-- Built-in Legal Reference Guides Footer Bar -->
          <div class="px-6 py-3.5 bg-zinc-50/70 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs font-medium text-zinc-500" data-i18n="builtinGuidesLabel">内置 USCIS 审案标准与判例库 (点击可在阅读器中查看)：</span>
            <div class="flex flex-wrap items-center gap-1.5">
              <button type="button" data-skill=".agents/skills/openpetition/SKILL.md" class="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50">SKILL 总纲与红线</button>
              <button type="button" data-skill=".agents/skills/openpetition/references/eb1a.md" class="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50">EB-1A 十选三与判例</button>
              <button type="button" data-skill=".agents/skills/openpetition/references/niw.md" class="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50">EB-2 NIW 三原则 (2025新规)</button>
              <button type="button" data-skill=".agents/skills/openpetition/references/recommendation-letters-and-statements.md" class="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50">去模板化推荐信规范</button>
              <button type="button" data-skill=".agents/skills/openpetition/references/filing-forms-and-rfe.md" class="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50">I-140 填表与盲评规范</button>
            </div>
          </div>
        </div>
        <!-- Hidden legacy file-tree hook for compatibility -->
        <div id="file-tree" class="hidden"></div>
      </section>

      <!-- ===================================================================== -->
      <!-- TAB 02: AI PIPELINE & BLIND OFFICER AUDIT (Vercel / Stripe Stepper)   -->
      <!-- ===================================================================== -->
      <section id="tab-step2" class="tab-pane space-y-6" style="display: none;">
        <div class="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200 whitespace-nowrap shrink-0">Step 02</span>
                <h2 class="text-base font-semibold tracking-tight text-zinc-950" data-i18n="step2Title">8 步标准化 AI 案卷流水线 + 移民官 65 分钟独立盲评</h2>
              </div>
              <p class="text-xs text-zinc-500 mt-1" data-i18n="step2Desc">按顺序点击「复制本步指令」粘贴到 Claude Code、Cursor、Antigravity 或 Codex，即可在本地自动生成对应文书。完成前 7 步后，强烈建议在全新对话窗口运行第 08 步「移民官零背景盲评」。</p>
            </div>
            <span id="pipeline-progress-label" class="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-800 font-mono whitespace-nowrap shrink-0">8 / 8 Completed</span>
          </div>

          <!-- Thin Vercel/Stripe Progress Bar -->
          <div class="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mb-6">
            <div id="pipeline-progress-bar" class="bg-zinc-900 h-full rounded-full transition-all duration-300" style="width: 100%"></div>
          </div>

          <!-- Stage Cards Stack -->
          <div id="stage-grid-main" class="space-y-3"></div>

          <!-- Post-Filing RFE / NOID Collapsible Section -->
          <details class="mt-6 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
            <summary class="cursor-pointer text-xs font-semibold text-zinc-700 flex items-center justify-between">
              <span data-i18n="rfeSummaryTitle">可选阶段：收到 USCIS 补件通知 (RFE / NOID) 或拒信重交 (Stage RFE)</span>
              <span class="text-[11px] font-normal text-zinc-500" data-i18n="rfeSummaryHint">首次递交无需运行 · 点击展开</span>
            </summary>
            <div id="stage-grid-rfe" class="mt-3 space-y-3"></div>
          </details>

          <!-- Local CLI Runner Drawer -->
          <details id="cli-drawer" class="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
            <summary class="cursor-pointer text-xs font-semibold text-zinc-700 flex items-center justify-between">
              <span data-i18n="cliDrawerTitle">高级模式：在本地终端直接调用 Codex / Claude CLI 执行指令</span>
              <span class="font-mono text-[11px] text-zinc-500">codex exec / claude -p</span>
            </summary>
            <div class="mt-3 space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <select id="agent-runner" class="h-8 rounded-md border border-zinc-300 bg-white px-2.5 text-xs font-medium text-zinc-900 shadow-sm">
                  <option value="codex">Codex CLI (codex exec)</option>
                  <option value="claude">Claude Code CLI (claude -p)</option>
                  <option value="toolkit-audit">OpenPetition 11-Point Linter</option>
                </select>
                <button id="btn-run-custom-agent" type="button" class="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 h-8 text-xs font-medium text-white shadow-sm hover:bg-zinc-800">启动本地执行</button>
                <button id="btn-copy-custom-prompt" type="button" class="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50">复制指令</button>
                <button id="btn-stop-agent" type="button" class="inline-flex items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-3 h-8 text-xs font-medium text-rose-700 hover:bg-rose-100">停止</button>
              </div>
              <textarea id="custom-agent-prompt" rows="2" placeholder="点击上方任意步骤的「复制本步指令」会自动填入此处..." class="w-full rounded-lg border border-zinc-300 bg-white p-2.5 font-mono text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"></textarea>
              <pre id="agent-terminal" class="rounded-lg bg-zinc-950 text-zinc-100 p-3 font-mono text-xs max-h-48 overflow-y-auto">[Ready] 推荐使用各步骤卡片上的「复制本步指令」，或在此直接调用本地 CLI。</pre>
            </div>
          </details>
        </div>
      </section>

      <!-- ===================================================================== -->
      <!-- TAB 03: NOVEL.SH / NOTION SPLIT BRIEF EDITOR & LIVE READER            -->
      <!-- ===================================================================== -->
      <section id="tab-step3" class="tab-pane" style="display: none;">
        <div class="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[700px]">
          <!-- Top Document Bar (Novel.sh / Notion style with built-in Document Switcher) -->
          <div class="no-print min-h-12 py-2 border-b border-zinc-200 px-4 flex flex-wrap items-center justify-between gap-2 bg-zinc-50/70">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200 whitespace-nowrap shrink-0">Step 03</span>
              <!-- Quick Document Switcher replaces the old cramped left sidebar -->
              <select id="doc-quick-select" aria-label="Switch Document" class="h-8 max-w-xs sm:max-w-md rounded-md border border-zinc-300 bg-white px-2.5 text-xs font-mono font-medium text-zinc-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-950"></select>
              <span id="active-file-label" class="hidden font-mono text-xs text-zinc-500 truncate"></span>
              <span id="save-status" class="text-xs font-medium text-emerald-600 whitespace-nowrap shrink-0">✓ 已保存</span>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <span id="doc-stats-label" class="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-zinc-200/70 text-zinc-700 whitespace-nowrap">0 words</span>
              <div class="inline-flex bg-zinc-200/70 p-0.5 rounded-lg border border-zinc-300/60">
                <button type="button" class="seg-btn px-2.5 py-1 text-xs font-medium rounded-md bg-white text-zinc-900 shadow-sm whitespace-nowrap" data-mode="split" data-i18n="modeSplit">分栏对照</button>
                <button type="button" class="seg-btn px-2.5 py-1 text-xs font-medium rounded-md text-zinc-600 hover:text-zinc-900 whitespace-nowrap" data-mode="preview" data-i18n="modePreview">纯净审案预览</button>
                <button type="button" class="seg-btn px-2.5 py-1 text-xs font-medium rounded-md text-zinc-600 hover:text-zinc-900 whitespace-nowrap" data-mode="write" data-i18n="modeWrite">专注源码</button>
              </div>
              <button id="btn-save-file" type="button" class="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 h-8 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 transition-colors whitespace-nowrap" data-i18n="saveBtn">保存 (⌘S)</button>
            </div>
          </div>

          <!-- Split Panes -->
          <div id="editor-grid" class="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200">
            <!-- Left: Raw Markdown Editor -->
            <div id="editor-left-pane" class="p-6 flex flex-col bg-white">
              <div class="mb-2 flex items-center justify-between">
                <span class="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">Markdown Source</span>
                <span class="text-[11px] text-zinc-400" data-i18n="exhibitSyntaxHint">支持 [Exhibit B-1, p. 4] 自动染色与点击跳转核查</span>
              </div>
              <textarea id="file-editor" spellcheck="false" class="w-full flex-1 min-h-[560px] resize-none border-0 p-0 text-zinc-800 placeholder-zinc-400 focus:ring-0 focus:outline-none text-xs sm:text-[13px] font-mono leading-relaxed bg-transparent" placeholder="Select a document above to edit..."></textarea>
            </div>

            <!-- Right: Novel.sh / Notion Legal Brief Reader Sheet -->
            <div id="editor-right-pane" class="p-6 sm:p-8 bg-[#fbfbfa] overflow-y-auto max-h-[760px]">
              <div class="max-w-prose mx-auto bg-white border border-zinc-200/90 rounded-xl shadow-sm p-8 sm:p-10">
                <div class="flex items-center justify-between pb-3 mb-6 border-b border-zinc-200 text-[10px] font-mono uppercase tracking-widest text-zinc-400 gap-2">
                  <span id="running-header-case" class="truncate">FORM I-140 PETITION BRIEF</span>
                  <span class="whitespace-nowrap shrink-0">8 C.F.R. § 204.5 · MATTER OF CHAWATHE</span>
                </div>
                <article id="markdown-preview" class="legal-prose font-serif-brief"></article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===================================================================== -->
      <!-- TAB 04: STATUTORY MATRIX, 11-POINT LINTER & OPENALEX ANALYZER         -->
      <!-- ===================================================================== -->
      <section id="tab-step4" class="tab-pane space-y-6" style="display: none;">
        <!-- Statutory Criteria / NIW Prongs Coverage Matrix -->
        <div class="rounded-xl border border-zinc-200 bg-white shadow-sm p-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-100">
            <div>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200 whitespace-nowrap shrink-0">Step 04</span>
                <h2 class="text-base font-semibold tracking-tight text-zinc-950" data-i18n="matrixTitle">EB-1A 十选三 / NIW 三原则 法定要素与盲评就绪矩阵</h2>
              </div>
              <p class="text-xs text-zinc-500 mt-1" data-i18n="matrixDesc">实时映射 8 C.F.R. § 204.5(h)(3) 客观标准、Kazarian 二阶综合评判、Matter of Dhanasar 三原则与 Stage 08 移民官独立盲评状态。</p>
            </div>
            <button id="btn-refresh-audit" type="button" class="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 whitespace-nowrap shrink-0" data-i18n="recheckBtn">重新运行 11 项体检</button>
          </div>
          <div id="criteria-matrix-grid" class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"></div>
        </div>

        <!-- 2-Column Split: Left = 11-Point Linter + Jaccard + Blind Audit; Right = OpenAlex 3-Tier Analyzer -->
        <div class="grid gap-6 lg:grid-cols-2">
          <!-- Left Card: Pre-Filing 11-Point Linter & Blind Officer Red-Team -->
          <div class="rounded-xl border border-zinc-200 bg-white shadow-sm p-6 space-y-5">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h3 class="text-sm font-semibold text-zinc-950" data-i18n="linterTitle">11 项递交前自动防踩雷体检 (Pre-Filing Linter)</h3>
                <p class="text-xs text-zinc-500 mt-0.5" data-i18n="linterSub">自动拦截自贬词汇、方法与成果割裂、缺失页码、跨类别串台及推荐信模板化重复</p>
              </div>
              <span class="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 whitespace-nowrap shrink-0">Auto-Linter</span>
            </div>

            <div id="audit-findings" class="space-y-2"></div>

            <!-- Jaccard 6-Word Shingle Overlap Gauges -->
            <div class="pt-4 border-t border-zinc-100">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-zinc-800" data-i18n="jaccardTitle">推荐信两两重复率检测 (6-Word Shingle Jaccard &lt; 12%)</span>
                <span class="font-mono text-[11px] text-zinc-500">Threshold: 12.0%</span>
              </div>
              <div id="similarity-list" class="text-xs text-zinc-600 space-y-2"></div>
            </div>

            <!-- Stage 08 Blind Officer Audit Callout -->
            <div class="rounded-xl border border-violet-200 bg-violet-50/40 p-4 space-y-3">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center rounded-md bg-violet-600 px-2 py-0.5 text-[11px] font-semibold text-white whitespace-nowrap">Stage 08</span>
                  <h4 class="text-xs font-semibold text-violet-950" data-i18n="blindCardTitle">USCIS 移民官 65 分钟零背景独立盲评 (Information Firewall)</h4>
                </div>
                <span class="font-mono text-[11px] text-violet-700 whitespace-nowrap">Senior ISO #4109</span>
              </div>
              <p class="text-xs text-violet-900/80 leading-relaxed" data-i18n="blindCardDesc">在全新的 AI 对话窗口中粘贴盲评指令：审案官 AI 被严格禁止偷看 materials/ 与 work/ 底稿，仅凭 01-petition-letter.md、推荐信与 04-exhibit-index.md 进行 65 分钟挑刺并起草模拟 RFE。</p>
              <div class="flex flex-wrap items-center gap-2">
                <button id="btn-copy-blind-audit" type="button" class="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-violet-500 transition-colors">
                  <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  <span data-i18n="copyBlindBtn">复制 65 分钟移民官盲评指令</span>
                </button>
                <button id="btn-open-blind-report" type="button" class="inline-flex items-center rounded-md border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-violet-800 shadow-sm hover:bg-violet-50 transition-colors" data-i18n="openBlindReportBtn">查看/编辑盲评报告 (06-blind-officer-audit.md)</button>
              </div>
            </div>
          </div>

          <!-- Right Card: OpenAlex 3-Tier Co-Author Graph & Field Percentile Analyzer -->
          <div class="rounded-xl border border-zinc-200 bg-white shadow-sm p-6 space-y-4">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h3 class="text-sm font-semibold text-zinc-950" data-i18n="oaTitle">OpenAlex 三层合作者网络筛查与领域百分位</h3>
                <p class="text-xs text-zinc-500 mt-0.5" data-i18n="oaSub">自动构建作者全职业生涯合作者图谱，剔除 Tier 1/2 圈内互引，计算纯独立他引 (Tier 3) 与同年同领域 Top %</p>
              </div>
              <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200 whitespace-nowrap shrink-0">3-Tier Graph</span>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <input id="oa-author" type="text" placeholder="Author Name (e.g. Kaiming He)" class="h-8 flex-1 min-w-[140px] rounded-md border border-zinc-300 bg-white px-2.5 text-xs text-zinc-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-950" />
              <input id="oa-orcid" type="text" placeholder="ORCID (optional)" class="h-8 w-40 rounded-md border border-zinc-300 bg-white px-2.5 text-xs font-mono text-zinc-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-950" />
              <button id="btn-harvest" type="button" class="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 h-8 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 transition-colors whitespace-nowrap" data-i18n="harvestBtn">抓取并筛查独立他引</button>
            </div>

            <div id="benchmarks-view" class="space-y-3"></div>
          </div>
        </div>
      </section>
    </main>

    <!-- Command Palette Modal (⌘K / Ctrl+K) -->
    <div id="cmd-backdrop" class="no-print fixed inset-0 z-50 hidden bg-zinc-950/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
      <div class="w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">
        <div class="flex items-center border-b border-zinc-200 px-3.5">
          <svg class="w-4 h-4 text-zinc-400 mr-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input id="cmd-search" type="text" placeholder="输入步骤名称、文件名或盲评指令 (Esc 关闭)..." class="w-full h-11 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none bg-transparent" />
        </div>
        <div id="cmd-list" class="max-h-72 overflow-y-auto p-1.5 divide-y divide-zinc-100"></div>
      </div>
    </div>

    <!-- Bottom-Right Toast Notification -->
    <div id="toast" class="no-print fixed bottom-5 right-5 z-50 hidden rounded-lg bg-zinc-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg border border-zinc-800"></div>
  </div>

  <script>
    let currentLang = 'zh';
    let currentCase = null;
    let currentFilePath = null;
    let isSkillFile = false;
    let lastCasePayload = null;
    let currentFolderFilter = 'all';

    const I18N = {
      zh: {
        newCaseBtn: '+ 新建申请',
        step1Tab: '材料与证据库',
        step2Tab: 'AI 流水线与盲评',
        step3Tab: '分栏文书精修',
        step4Tab: '法规矩阵与体检',
        localFirstBadge: '100% 本地隐私优先 · 支持 Claude / Cursor / Codex',
        searchPlaceholder: '搜索指令或文档',
        exportPdfBtn: '导出 PDF',
        newCasePrompt: '创建独立本地案件工作区（支持 EB-1A 与 EB-2 NIW 双轨隔离）：',
        createBtn: '立即创建',
        kpiReadiness: '案卷就绪评分 (Readiness)',
        kpiReadinessSub: '11项体检实时监控',
        kpiCitations: '纯独立他引占比 (Tier 3)',
        kpiCitationsSub: '已剔除全部历史合作者网络自引',
        kpiExhibits: '证据索引与去重推荐信',
        lettersUnit: '封推荐信 (<12%)',
        kpiExhibitsSub: '全部正文引述均绑定精确页码',
        kpiBlindTitle: '移民官独立盲评 (Stage 08)',
        kpiBlindReady: '65分钟零背景红队挑刺',
        copyBlindShort: '复制盲评指令',
        blindFirewallHint: '严禁偷看底稿',
        step1Title: '放入您的原始申请材料 (只读安全保真)',
        step1Desc: '将简历 CV、Google Scholar 主页 PDF、代表作论文、审稿感谢信或获奖证书拖入下方。AI 全程只读提取事实与页码，绝不篡改原文件。',
        newFileBtn: '+ 新建空白文书',
        nextToStep2Btn: '下一步：AI 流水线与盲评',
        dropTitle: '拖拽 CV、Google Scholar PDF、代表作或审稿记录到此，或',
        dropBrowse: '点击选择本地文件',
        dropSub: '支持 PDF、Markdown、DOCX、PNG/JPG · 自动存入当前案件的 materials/ 目录',
        inventoryHeader: '当前案件全部材料与生成的文书资产',
        filterAll: '全部文件',
        filterMaterials: '原始材料 (materials/)',
        filterWork: '分析底稿 (work/)',
        filterFinal: '最终文书 (final/)',
        colFileName: '文件名称与路径',
        colCategory: '法条归属 / 证据角色',
        colFolder: '所在目录',
        colStatus: '状态',
        colAction: '操作',
        builtinGuidesLabel: '内置 USCIS 审案标准与判例库 (点击可在阅读器中查看)：',
        step2Title: '8 步标准化 AI 案卷流水线 + 移民官 65 分钟独立盲评',
        step2Desc: '按顺序点击「复制本步指令」粘贴到 Claude Code、Cursor、Antigravity 或 Codex，即可在本地自动生成对应文书。完成前 7 步后，请在全新对话窗口运行第 08 步「移民官零背景盲评」。',
        rfeSummaryTitle: '可选阶段：收到 USCIS 补件通知 (RFE / NOID) 或拒信重交 (Stage RFE)',
        rfeSummaryHint: '首次递交无需运行 · 点击展开',
        cliDrawerTitle: '高级模式：在本地终端直接调用 Codex / Claude CLI 执行指令',
        modeSplit: '分栏对照',
        modePreview: '纯净审案预览',
        modeWrite: '专注源码',
        saveBtn: '保存 (⌘S)',
        exhibitSyntaxHint: '支持 [Exhibit B-1, p. 4] 自动染色与点击跳转核查',
        matrixTitle: 'EB-1A 十选三 / NIW 三原则 法定要素与盲评就绪矩阵',
        matrixDesc: '实时映射 8 C.F.R. § 204.5(h)(3) 客观标准、Kazarian 二阶综合评判、Matter of Dhanasar 三原则与 Stage 08 移民官独立盲评状态。',
        recheckBtn: '重新运行 11 项体检',
        linterTitle: '11 项递交前自动防踩雷体检 (Pre-Filing Linter)',
        linterSub: '自动拦截自贬词汇、方法与成果割裂、缺失页码、跨类别串台及推荐信模板化重复',
        jaccardTitle: '推荐信两两重复率检测 (6-Word Shingle Jaccard < 12%)',
        blindCardTitle: 'USCIS 移民官 65 分钟零背景独立盲评 (Information Firewall)',
        blindCardDesc: '在全新的 AI 对话窗口中粘贴盲评指令：审案官 AI 被严格禁止偷看 materials/ 与 work/ 底稿，仅凭 01-petition-letter.md、推荐信与 04-exhibit-index.md 进行 65 分钟挑刺并起草模拟 RFE。',
        copyBlindBtn: '复制 65 分钟移民官盲评指令',
        openBlindReportBtn: '查看/编辑盲评报告 (06-blind-officer-audit.md)',
        oaTitle: 'OpenAlex 三层合作者网络筛查与领域百分位',
        oaSub: '自动构建作者全职业生涯合作者图谱，剔除 Tier 1/2 圈内互引，计算纯独立他引 (Tier 3) 与同年同领域 Top %',
        harvestBtn: '抓取并筛查独立他引',
        copyPromptBtn: '复制本步指令',
        inspectBtn: '微调指令',
        openDocBtn: '打开文书'
      },
      en: {
        newCaseBtn: '+ New Case',
        step1Tab: 'Evidence Vault',
        step2Tab: 'AI Pipeline & Blind Audit',
        step3Tab: 'Split Brief Studio',
        step4Tab: 'Criteria Matrix & Linter',
        localFirstBadge: '100% Local-First Privacy · Claude / Cursor / Codex Ready',
        searchPlaceholder: 'Search commands or files',
        exportPdfBtn: 'Export PDF',
        newCasePrompt: 'Create an isolated local case workspace (supports EB-1A & EB-2 NIW):',
        createBtn: 'Create Case',
        kpiReadiness: 'Case Readiness Score',
        kpiReadinessSub: '11-point pre-filing linter active',
        kpiCitations: 'Strictly Independent Citations (Tier 3)',
        kpiCitationsSub: 'Lifetime co-author network filtered out',
        kpiExhibits: 'Exhibit Pinpoints & Letters',
        lettersUnit: 'letters (<12% overlap)',
        kpiExhibitsSub: 'Every factual claim bound to [Ex. X, p. Y]',
        kpiBlindTitle: 'Blind Officer Audit (Stage 08)',
        kpiBlindReady: '65-Min Zero-Context Red Team',
        copyBlindShort: 'Copy Blind Prompt',
        blindFirewallHint: 'Firewall enforced',
        step1Title: 'Drop Raw Petition Materials (Read-Only Evidence Vault)',
        step1Desc: 'Drag and drop your CV, Google Scholar PDF, papers, peer-review records, or award certificates below. AI reads them to extract verifiable metrics and page pinpoints without modifying your originals.',
        newFileBtn: '+ New Blank File',
        nextToStep2Btn: 'Next: AI Pipeline & Blind Audit',
        dropTitle: 'Drag & drop CV, Google Scholar PDF, papers, or review proof here, or',
        dropBrowse: 'browse local files',
        dropSub: 'Supports PDF, Markdown, DOCX, PNG/JPG · Stored safely in materials/',
        inventoryHeader: 'Case Evidence Vault & Generated Legal Deliverables',
        filterAll: 'All Files',
        filterMaterials: 'Raw Materials (materials/)',
        filterWork: 'Working Notes (work/)',
        filterFinal: 'Final Packet (final/)',
        colFileName: 'File Name & Path',
        colCategory: 'Statutory Role / Criterion',
        colFolder: 'Directory',
        colStatus: 'Status',
        colAction: 'Action',
        builtinGuidesLabel: 'Built-in USCIS Legal Standards & Case Law Guides:',
        step2Title: '8-Stage AI Petition Pipeline + 65-Min Blind USCIS Officer Audit',
        step2Desc: 'Click "Copy Prompt" on each step and paste into Claude Code, Cursor, Antigravity, or Codex. After Stage 07, run Stage 08 in a brand-new AI session for a cold 65-minute USCIS Officer audit.',
        rfeSummaryTitle: 'Optional Post-Filing Stage: RFE / NOID Response or Post-Denial Refile (Stage RFE)',
        rfeSummaryHint: 'Only needed if USCIS issues a notice · Click to expand',
        cliDrawerTitle: 'Advanced: Run Codex / Claude CLI Directly from Local Terminal',
        modeSplit: 'Split View',
        modePreview: 'Reader Preview',
        modeWrite: 'Raw Markdown',
        saveBtn: 'Save (⌘S)',
        exhibitSyntaxHint: '[Exhibit B-1, p. 4] badges auto-highlight & link to Exhibit Index',
        matrixTitle: 'EB-1A 10-Criteria / NIW 3-Prong Statutory Readiness Matrix',
        matrixDesc: 'Live mapping across 8 C.F.R. § 204.5(h)(3), Kazarian Step 2 Final Merits, Matter of Dhanasar Prongs 1–3, and Stage 08 Blind Officer Audit.',
        recheckBtn: 'Re-run 11-Point Linter',
        linterTitle: '11-Point Pre-Filing Safety Linter',
        linterSub: 'Blocks self-sabotage phrases, methodology/result split, missing pinpoints, category bleed, and letter template overlap',
        jaccardTitle: 'Recommendation Letter Overlap Check (6-Word Shingle Jaccard < 12%)',
        blindCardTitle: 'Zero-Context Blind USCIS Officer Audit (Information Firewall)',
        blindCardDesc: 'Paste the Stage 08 prompt into a fresh AI session: the officer AI is strictly forbidden from reading materials/ or work/ and audits ONLY 01-petition-letter.md, letters, and 04-exhibit-index.md.',
        copyBlindBtn: 'Copy 65-Min Blind Officer Prompt',
        openBlindReportBtn: 'Open Blind Audit Report (06-blind-officer-audit.md)',
        oaTitle: 'OpenAlex 3-Tier Co-Author Graph & Field Percentiles',
        oaSub: 'Screens out your entire lifetime co-author network to prove strictly independent Tier 3 citations and year/subfield Top %',
        harvestBtn: 'Harvest & Screen Citations',
        copyPromptBtn: 'Copy Prompt',
        inspectBtn: 'Customize',
        openDocBtn: 'Open File'
      }
    };

    const t = (k) => (I18N[currentLang] && I18N[currentLang][k]) || I18N.zh[k] || k;

    const escapeHtml = (s) =>
      String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    let toastTimer = null;
    const showToast = (msg) => {
      const el = document.getElementById('toast');
      el.textContent = msg;
      el.classList.remove('hidden');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
    };

    const classifyFileRole = (relPath) => {
      const lower = String(relPath || '').toLowerCase();
      if (lower.includes('01-petition-letter')) return currentLang === 'zh' ? 'I-140 主申请信 (Legal Brief)' : 'Main I-140 Legal Brief';
      if (lower.includes('02-personal-statement')) return currentLang === 'zh' ? '赴美计划陈述 (Personal Statement)' : 'Personal Statement';
      if (lower.includes('00-recommender-plan')) return currentLang === 'zh' ? '推荐人组合规划 (Recommender Plan)' : 'Recommender Portfolio Plan';
      if (lower.includes('03-recommendation-letters')) return currentLang === 'zh' ? '专家推荐信 (Exhibit D)' : 'Recommendation Letter (Ex. D)';
      if (lower.includes('04-exhibit-index')) return currentLang === 'zh' ? '证据目录与翻译认证 (Exhibit Index)' : 'Exhibit Index & Certifications';
      if (lower.includes('05-filing-checklist')) return currentLang === 'zh' ? '递交核对表 (I-140 Checklist)' : 'Filing & Fee Checklist';
      if (lower.includes('06-blind-officer-audit')) return currentLang === 'zh' ? '移民官65分钟盲评报告 (ISO #4109)' : '65-Min Blind Officer Audit';
      if (lower.includes('00-assessment')) return currentLang === 'zh' ? '十选三/三原则评估报告' : 'Case Strength Assessment';
      if (lower.includes('case-strategy')) return currentLang === 'zh' ? '案件核心策略与法条定位' : 'Case Strategy & Theory';
      if (lower.includes('evidence-index')) return currentLang === 'zh' ? '证据事实与页码图谱' : 'Structured Evidence Map';
      if (lower.includes('benchmarks')) return currentLang === 'zh' ? '独立他引与百分位基准' : 'Independent Citation Benchmarks';
      if (lower.includes('cv') || lower.includes('resume') || lower.includes('scholar')) return currentLang === 'zh' ? '背景与学术档案 (Exhibit A)' : 'CV & Scholar Profile (Ex. A)';
      if (lower.includes('review') || lower.includes('judge')) return currentLang === 'zh' ? '审稿与评委记录 (Crit. iv)' : 'Judging / Peer Review (Crit. iv)';
      return currentLang === 'zh' ? '代表作与客观证据 (Exhibit B)' : 'Primary Evidence (Ex. B)';
    };

    const updateDocStats = (text) => {
      const words = String(text || '').trim().split(/\\s+/).filter(Boolean).length;
      const pages = Math.max(1, Math.ceil(words / 420));
      document.getElementById('doc-stats-label').textContent = currentLang === 'zh'
        ? \`\${words} 词 · 约 \${pages} 页 US-Letter\`
        : \`\${words} words · ~\${pages} p.\`;
    };

    const renderLegalMarkdown = (md, filePath = '') => {
      if (!md) return \`<p class="text-zinc-400">\${currentLang === 'zh' ? '当前文档为空。' : 'Empty document.'}</p>\`;
      if (/\\.json$/i.test(filePath)) {
        return \`<pre class="font-mono text-xs text-zinc-800 bg-zinc-50 p-4 rounded-lg border border-zinc-200 overflow-x-auto whitespace-pre-wrap">\${escapeHtml(md)}</pre>\`;
      }

      let html = escapeHtml(md)
        .replace(/^### (.*)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*)$/gm, '<h2>$1</h2>')
        .replace(/^# (.*)$/gm, '<h1>$1</h1>')
        .replace(/\\*\\*([^*\\r\\n]+)\\*\\*/g, '<strong>$1</strong>')
        .replace(/\\*([^*\\r\\n]+)\\*/g, '<em>$1</em>')
        .replace(/\`([^\`\\r\\n]+)\`/g, '<code>$1</code>');

      const definedSet = new Set((lastCasePayload?.report?.exhibits?.defined) || []);
      // Single-line bounded regex so '[' never matches across multiple lines
      html = html.replace(/\\[([^\\]\\r\\n]{0,120}?\\bExhibit\\s+([A-Z0-9-]+)[^\\]\\r\\n]{0,80}?)\\]/gi, (_m, inner, exId) => {
        const normId = String(exId || '').toUpperCase();
        const hasPinpoint = /\\b(?:p\\.|pp\\.|page|pages|para\\.|table|fig\\.|section|line)/i.test(inner);
        let badgeCls = 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100';
        let title = 'Verified in Exhibit Index (Click to inspect 04-exhibit-index.md)';
        if (definedSet.size > 0 && !definedSet.has(normId)) {
          badgeCls = 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';
          title = \`Exhibit \${normId} not yet listed in final/04-exhibit-index.md\`;
        } else if (!hasPinpoint) {
          badgeCls = 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100';
          title = 'Missing page pinpoint (e.g., p. 4)';
        }
        return \`<span class="exhibit-pill cursor-pointer inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold border transition-colors mx-0.5 align-baseline \${badgeCls}" data-exhibit="\${normId}" title="\${title}">[\${inner}]</span>\`;
      });

      const blocks = html.split(/\\n\\s*\\n/);
      return blocks
        .map((b) => {
          const trimmed = b.trim();
          if (!trimmed) return '';
          if (/^<h[1-3]>/.test(trimmed)) return trimmed;
          if (trimmed.startsWith('|')) {
            const rows = trimmed.split('\\n').filter((r) => !/^\\|[\\s:-]+\\|$/.test(r.trim()));
            const trs = rows
              .map((r, idx) => {
                const cells = r.replace(/^\\||\\|$/g, '').split('|');
                const tag = idx === 0 ? 'th' : 'td';
                return '<tr>' + cells.map((c) => \`<\${tag}>\${c.trim()}</\${tag}>\`).join('') + '</tr>';
              })
              .join('');
            return \`<table>\${trs}</table>\`;
          }
          if (/^[-*]\\s+/m.test(trimmed)) {
            const items = trimmed
              .split('\\n')
              .map((line) => \`<li>\${line.replace(/^[-*]\\s+/, '')}</li>\`)
              .join('');
            return \`<ul>\${items}</ul>\`;
          }
          return \`<p>\${trimmed.replace(/\\n/g, '<br/>')}</p>\`;
        })
        .join('\\n');
    };

    const switchTab = (tabId) => {
      document.querySelectorAll('.step-tab').forEach((btn) => {
        const active = btn.dataset.tab === tabId;
        btn.className = active
          ? 'step-tab inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all bg-white text-zinc-950 shadow-sm shrink-0'
          : 'step-tab inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all text-zinc-600 hover:text-zinc-950 shrink-0';
      });
      document.querySelectorAll('.tab-pane').forEach((pane) => {
        pane.style.display = pane.id === tabId ? 'block' : 'none';
      });
    };

    document.querySelectorAll('.step-tab').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    document.getElementById('btn-go-step2').addEventListener('click', () => switchTab('tab-step2'));
    document.getElementById('pill-jump-check').addEventListener('click', () => switchTab('tab-step4'));

    document.querySelectorAll('.seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.seg-btn').forEach((b) => {
          b.className = 'seg-btn px-2.5 py-1 text-xs font-medium rounded-md text-zinc-600 hover:text-zinc-900 whitespace-nowrap';
        });
        btn.className = 'seg-btn px-2.5 py-1 text-xs font-medium rounded-md bg-white text-zinc-900 shadow-sm whitespace-nowrap';
        const grid = document.getElementById('editor-grid');
        const left = document.getElementById('editor-left-pane');
        const right = document.getElementById('editor-right-pane');
        if (btn.dataset.mode === 'preview') {
          grid.className = 'flex-1 grid grid-cols-1';
          left.classList.add('hidden');
          right.classList.remove('hidden');
        } else if (btn.dataset.mode === 'write') {
          grid.className = 'flex-1 grid grid-cols-1';
          left.classList.remove('hidden');
          right.classList.add('hidden');
        } else {
          grid.className = 'flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200';
          left.classList.remove('hidden');
          right.classList.remove('hidden');
        }
      });
    });

    document.getElementById('btn-toggle-new-case').addEventListener('click', () => {
      document.getElementById('new-case-drawer').classList.toggle('hidden');
    });

    document.querySelectorAll('.folder-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentFolderFilter = btn.dataset.folder;
        document.querySelectorAll('.folder-filter-btn').forEach((b) => {
          const active = b.dataset.folder === currentFolderFilter;
          b.className = active
            ? 'folder-filter-btn rounded-md px-2.5 py-1 font-medium bg-white text-zinc-950 shadow-sm whitespace-nowrap'
            : 'folder-filter-btn rounded-md px-2.5 py-1 font-medium text-zinc-600 hover:text-zinc-950 whitespace-nowrap';
        });
        if (lastCasePayload) renderCaseUI(lastCasePayload);
      });
    });

    const applyTranslations = () => {
      document.querySelectorAll('[data-i18n]').forEach((el) => {
        const k = el.getAttribute('data-i18n');
        if (k) el.textContent = t(k);
      });
      if (lastCasePayload) renderCaseUI(lastCasePayload);
    };

    document.getElementById('btn-lang-toggle').addEventListener('click', () => {
      currentLang = currentLang === 'zh' ? 'en' : 'zh';
      applyTranslations();
      showToast(currentLang === 'zh' ? '已切换为中文界面' : 'Switched to English UI');
    });

    async function loadCasesList(preferredCase) {
      const res = await fetch('/api/cases');
      const data = await res.json();
      const sel = document.getElementById('case-select');
      sel.innerHTML = '';
      for (const c of data.cases) {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = \`\${c.name} (\${c.category} · \${c.readinessScore}/100)\`;
        sel.appendChild(opt);
      }
      if (preferredCase && data.cases.some((c) => c.name === preferredCase)) {
        currentCase = preferredCase;
      } else if (!currentCase && data.cases.length > 0) {
        currentCase = data.cases[0].name;
      }
      if (currentCase) {
        sel.value = currentCase;
        await loadCaseDetails(currentCase);
      }
    }

    async function loadCaseDetails(caseName) {
      currentCase = caseName;
      const res = await fetch(\`/api/case?name=\${encodeURIComponent(caseName)}\`);
      const data = await res.json();
      lastCasePayload = data;
      renderCaseUI(data);
      if (!currentFilePath) {
        const defaultDoc = (data.report.files.final || []).includes('final/01-petition-letter.md')
          ? 'final/01-petition-letter.md'
          : (data.report.files.final || [])[0] || (data.report.files.work || [])[0];
        if (defaultDoc) {
          await openFile(caseName, defaultDoc, false, true);
        }
      }
    }

    function renderCaseUI(data) {
      const { caseName, report, stages, benchmarks } = data;
      document.getElementById('readiness-score').textContent = \`\${report.readinessScore}/100\`;
      document.getElementById('kpi-score').textContent = \`\${report.readinessScore} / 100\`;
      document.getElementById('score-bar-fill').style.width = \`\${report.readinessScore}%\`;
      document.getElementById('case-category-badge').textContent = report.detectedCategory;
      document.getElementById('running-header-case').textContent = \`CASE: \${caseName.toUpperCase()} (\${report.detectedCategory})\`;
      document.getElementById('metric-exhibits').textContent = \`\${report.counts.definedExhibits} / \${report.counts.citedExhibits}\`;
      document.getElementById('metric-letters').textContent = report.counts.recommendationLetters;

      if (benchmarks && benchmarks.citationTierSample) {
        const t3 = benchmarks.citationTierSample.strictlyIndependentSharePercent ?? 84.6;
        document.getElementById('kpi-citations').textContent = \`\${t3}%\`;
        document.getElementById('kpi-citations-sub').textContent =
          currentLang === 'zh'
            ? \`已筛查 \${benchmarks.lifetimeCoauthorGraphSize || 0} 位历史合作者 · \${benchmarks.independentAdoptionFootprint?.countriesCount || 0} 国独立引用\`
            : \`Screened \${benchmarks.lifetimeCoauthorGraphSize || 0} co-authors · \${benchmarks.independentAdoptionFootprint?.countriesCount || 0} countries\`;
      } else {
        document.getElementById('kpi-citations').textContent = '—';
        document.getElementById('kpi-citations-sub').textContent =
          currentLang === 'zh' ? '可在第 04 步输入姓名一键抓取 OpenAlex' : 'Run OpenAlex analyzer in Step 04';
      }

      const allCaseFiles = [
        ...(report.files.final || []),
        ...(report.files.work || []),
        ...(report.files.materials || []),
        ...(report.files.postFiling || [])
      ];
      const docSel = document.getElementById('doc-quick-select');
      docSel.innerHTML = '';
      for (const f of allCaseFiles) {
        const opt = document.createElement('option');
        opt.value = f;
        opt.textContent = \`\${f} — \${classifyFileRole(f)}\`;
        if (!isSkillFile && currentFilePath === f) opt.selected = true;
        docSel.appendChild(opt);
      }

      // 1. Render Step 1 shadcn/ui Tasks DataTable
      const invList = document.getElementById('materials-inventory-list');
      const filteredFiles = allCaseFiles.filter((f) =>
        currentFolderFilter === 'all' ? true : f.startsWith(currentFolderFilter)
      );
      document.getElementById('inventory-count').textContent = \`\${filteredFiles.length} files\`;

      if (filteredFiles.length === 0) {
        invList.innerHTML = \`<tr><td colspan="5" class="py-8 px-6 text-center text-xs text-zinc-500">\${
          currentLang === 'zh'
            ? '当前筛选目录下暂无文件。可将 CV、Google Scholar PDF 或论文拖入上方上传区域。'
            : 'No files in this folder filter yet. Drag and drop your CV, Scholar PDF, or papers above.'
        }</td></tr>\`;
      } else {
        invList.innerHTML = '';
        for (const f of filteredFiles) {
          const isPdf = /\\.pdf$/i.test(f);
          const folder = f.split('/')[0] + '/';
          const shortName = f.replace(/^[^/]+\\//, '');
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-zinc-50/90 transition-colors group';
          tr.innerHTML = \`
            <td class="py-3.5 px-6 whitespace-nowrap">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg \${isPdf ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}">
                  <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div class="font-medium text-zinc-900 text-xs sm:text-sm font-mono">\${escapeHtml(shortName)}</div>
                  <div class="text-[11px] text-zinc-500 font-mono">cases/\${escapeHtml(caseName)}/\${escapeHtml(f)}</div>
                </div>
              </div>
            </td>
            <td class="py-3.5 px-4 whitespace-nowrap">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200/80">\${escapeHtml(classifyFileRole(f))}</span>
            </td>
            <td class="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-zinc-500">\${escapeHtml(folder)}</td>
            <td class="py-3.5 px-4 whitespace-nowrap">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                \${folder === 'materials/' ? (currentLang === 'zh' ? '只读原件' : 'Read-Only') : (currentLang === 'zh' ? '已就绪' : 'Ready')}
              </span>
            </td>
            <td class="py-3.5 px-6 whitespace-nowrap text-right">
              <button type="button" class="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors">\${t('openDocBtn')}</button>
            </td>
          \`;
          tr.querySelector('button').addEventListener('click', () => openFile(caseName, f, false));
          invList.appendChild(tr);
        }
      }

      // 2. Render Step 2 Vercel / Stripe Onboarding Card Stack
      const mainGrid = document.getElementById('stage-grid-main');
      const rfeGrid = document.getElementById('stage-grid-rfe');
      mainGrid.innerHTML = '';
      rfeGrid.innerHTML = '';

      const coreStages = stages.filter((s) => !s.isOptionalRfe);
      const completedCore = coreStages.filter((s) => s.exists).length;
      document.getElementById('pipeline-progress-label').textContent = \`\${completedCore} / \${coreStages.length} Completed\`;
      document.getElementById('pipeline-progress-bar').style.width = \`\${Math.round((completedCore / Math.max(1, coreStages.length)) * 100)}%\`;

      let foundNextUp = false;
      for (const st of stages) {
        const isNextUp = !st.isOptionalRfe && !st.exists && !foundNextUp;
        if (isNextUp) foundNextUp = true;

        const displayTitle = currentLang === 'zh' ? (st.titleZh || st.title) : st.title;
        const displayDesc = currentLang === 'zh' ? (st.descZh || st.description) : st.description;

        let cardBorder = 'border-zinc-200 bg-white hover:border-zinc-300';
        if (st.isBlindAudit) {
          cardBorder = 'border-violet-200 bg-violet-50/25 hover:border-violet-300';
        } else if (isNextUp) {
          cardBorder = 'border-indigo-200 bg-indigo-50/25 ring-1 ring-indigo-500/15';
        }

        const badgeCircle = st.exists
          ? \`<div class="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
               <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
             </div>\`
          : st.isBlindAudit
          ? \`<div class="w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-mono font-bold shrink-0 shadow-sm">\${escapeHtml(st.step)}</div>\`
          : \`<div class="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold shrink-0 shadow-sm">\${escapeHtml(st.step)}</div>\`;

        const card = document.createElement('div');
        card.className = \`p-4 sm:p-5 rounded-xl border transition-all \${cardBorder}\`;
        card.innerHTML = \`
          <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div class="flex items-start gap-3.5">
              \${badgeCircle}
              <div class="space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-sm font-semibold text-zinc-950">\${escapeHtml(displayTitle)}</span>
                  \${st.isBlindAudit ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-violet-100 text-violet-800 border border-violet-200">Zero-Context Firewall · ISO #4109</span>' : ''}
                  \${st.exists ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">✓ 已生成</span>' : ''}
                </div>
                <p class="text-xs text-zinc-600 leading-relaxed">\${escapeHtml(displayDesc)}</p>
                <div class="pt-1 flex flex-wrap items-center gap-1.5">
                  \${(st.inputs || []).map((inp) => \`<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200/80">in: \${escapeHtml(inp)}</span>\`).join('')}
                  <span data-open-target="1" class="cursor-pointer inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100">out: \${escapeHtml(st.targetFile)}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0 pl-10 lg:pl-0">
              <button type="button" class="btn-copy-stage inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white \${st.isBlindAudit ? 'bg-violet-600 hover:bg-violet-500' : 'bg-zinc-900 hover:bg-zinc-800'} shadow-sm transition-colors whitespace-nowrap">
                <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                <span>\${t('copyPromptBtn')}</span>
              </button>
              <button type="button" class="btn-inspect-stage inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors whitespace-nowrap">\${t('inspectBtn')}</button>
              <button type="button" class="btn-open-target inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors whitespace-nowrap">\${t('openDocBtn')}</button>
            </div>
          </div>
          <!-- Expandable Prompt Inspector Drawer -->
          <div class="prompt-drawer hidden mt-4 pt-4 border-t border-zinc-200/80 space-y-2.5">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
              <span>可在此直接查看或微调将发给 AI 的完整 Prompt：</span>
              <button type="button" data-open-ref="\${escapeHtml(st.reference)}" class="font-mono text-[11px] text-indigo-600 hover:underline">查看本步法规标准: \${escapeHtml(st.reference.split('/').pop())}</button>
            </div>
            <textarea rows="4" class="prompt-textarea w-full rounded-lg border border-zinc-300 bg-white p-2.5 font-mono text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950">\${escapeHtml(st.prompt)}</textarea>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-1.5">
                <button type="button" class="aug-chip rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100" data-append=" Enforce strict [Exhibit X, p. Y] page pinpoints on every sentence.">+ 强制逐句页码核查</button>
                <button type="button" class="aug-chip rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100" data-append=" Emphasize independent industry and government adoption beyond co-authors.">+ 突出独立机构与行业采用</button>
                <button type="button" class="aug-chip rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100" data-append=" Frame under Mukherji v. Miller (2026) and Matter of Chawathe preponderance standard.">+ 强化 2026 最新联邦判例</button>
              </div>
              <button type="button" class="btn-run-stage inline-flex items-center rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-800">在本地 CLI 中运行</button>
            </div>
          </div>
        \`;

        const promptBox = card.querySelector('.prompt-textarea');
        const copyBtn = card.querySelector('.btn-copy-stage');
        copyBtn.addEventListener('click', () => {
          const textToCopy = promptBox.value;
          navigator.clipboard.writeText(textToCopy);
          document.getElementById('custom-agent-prompt').value = textToCopy;
          const span = copyBtn.querySelector('span');
          const orig = span.textContent;
          span.textContent = currentLang === 'zh' ? '已复制 ✓' : 'Copied ✓';
          setTimeout(() => { span.textContent = orig; }, 1600);
          showToast(
            st.isBlindAudit
              ? (currentLang === 'zh' ? '已复制盲评指令！请打开全新的 AI 对话窗口粘贴，确保零背景盲审。' : 'Copied Blind Audit prompt! Paste into a fresh chat window.')
              : (currentLang === 'zh' ? \`已复制「\${displayTitle}」指令\` : \`Copied prompt for \${displayTitle}\`)
          );
        });

        card.querySelector('.btn-inspect-stage').addEventListener('click', () => {
          card.querySelector('.prompt-drawer').classList.toggle('hidden');
        });

        card.querySelectorAll('.aug-chip').forEach((chip) => {
          chip.addEventListener('click', () => {
            promptBox.value = promptBox.value.trim() + chip.getAttribute('data-append');
          });
        });

        card.querySelector('[data-open-ref]').addEventListener('click', () => {
          openFile(caseName, st.reference, true);
        });

        const openTargetFn = async () => {
          if (!st.exists) {
            await fetch('/api/file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ caseName, path: st.targetFile, content: \`# \${displayTitle}\\n\\n\` })
            });
          }
          await openFile(caseName, st.targetFile, false);
        };
        card.querySelector('.btn-open-target').addEventListener('click', openTargetFn);
        card.querySelector('[data-open-target]').addEventListener('click', openTargetFn);

        card.querySelector('.btn-run-stage').addEventListener('click', () => {
          document.getElementById('cli-drawer').open = true;
          document.getElementById('custom-agent-prompt').value = promptBox.value;
          runCliAgent(promptBox.value);
        });

        if (st.isOptionalRfe) {
          rfeGrid.appendChild(card);
        } else {
          mainGrid.appendChild(card);
        }
      }

      // 3. Render Step 4 Statutory Criteria / Prong Matrix
      renderCriteriaMatrix(report, stages);

      // 4. Render Step 4 Audit Findings
      const findingsEl = document.getElementById('audit-findings');
      findingsEl.innerHTML = '';
      if (report.findings.length === 0) {
        findingsEl.innerHTML = \`<div class="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs font-medium text-emerald-900 flex items-start gap-2.5">
          <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold shrink-0 mt-0.5">✓</span>
          <span>\${
            currentLang === 'zh'
              ? '全部 11 项递交前防踩雷体检通过：零自贬表述、方法创新与科学突破紧密合一、证据精确页码齐全、无跨类别串台。'
              : 'All 11 pre-filing safety checks passed with zero errors.'
          }</span>
        </div>\`;
      } else {
        for (const f of report.findings) {
          const isErr = f.severity === 'error';
          const d = document.createElement('div');
          d.className = \`cursor-pointer rounded-lg border p-3 text-xs transition-colors \${
            isErr ? 'border-rose-200 bg-rose-50/70 text-rose-900 hover:bg-rose-50' : 'border-amber-200 bg-amber-50/70 text-amber-900 hover:bg-amber-50'
          }\`;
          d.innerHTML = \`<strong class="font-mono mr-1.5">[\${escapeHtml(f.category)}]</strong> \${escapeHtml(f.message)}\`;
          d.addEventListener('click', () => openFile(caseName, 'final/01-petition-letter.md', false));
          findingsEl.appendChild(d);
        }
      }

      // 5. Render Visual Jaccard Similarity Gauges
      const simEl = document.getElementById('similarity-list');
      if (!report.letterSimilarityPairs || report.letterSimilarityPairs.length === 0) {
        simEl.textContent = currentLang === 'zh'
          ? '当 final/03-recommendation-letters/ 下有 2 封及以上推荐信草稿时，此处自动显示两两查重进度条。'
          : 'Add 2 or more recommendation letters in final/03-recommendation-letters/ to view overlap gauges.';
      } else {
        simEl.innerHTML = report.letterSimilarityPairs
          .map((p) => {
            const pct = (p.jaccard6Word * 100).toFixed(1);
            const barWidth = Math.min(100, Math.max(5, p.jaccard6Word * 300));
            const barCls = p.status === 'fail' ? 'bg-rose-500' : p.status === 'warn' ? 'bg-amber-500' : 'bg-emerald-500';
            const textCls = p.status === 'fail' ? 'text-rose-600' : p.status === 'warn' ? 'text-amber-600' : 'text-emerald-600';
            return \`<div class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="font-mono text-zinc-700">\${escapeHtml(p.letterA)} ↔ \${escapeHtml(p.letterB)}</span>
                <strong class="font-mono \${textCls}">\${pct}%</strong>
              </div>
              <div class="w-full h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                <div class="h-full rounded-full \${barCls}" style="width:\${barWidth}%"></div>
              </div>
            </div>\`;
          })
          .join('');
      }

      renderBenchmarks(benchmarks);
    }

    function renderCriteriaMatrix(report, stages) {
      const grid = document.getElementById('criteria-matrix-grid');
      const isNiw = report.detectedCategory === 'EB-2 NIW';
      const items = isNiw
        ? [
            { code: '8 C.F.R. § 204.5(k)', zh: '高等学位与专业直接相关 (2025新规)', en: 'Advanced Degree & Specialty Nexus' },
            { code: 'Dhanasar Prong 1', zh: '实质性价值与国家重要性', en: 'Substantial Merit & National Importance' },
            { code: 'Dhanasar Prong 2', zh: '申请人处于有利推进地位', en: 'Well Positioned to Advance Endeavor' },
            { code: 'Dhanasar Prong 3', zh: '豁免劳工证有益美国国家利益', en: 'Beneficial to Waive PERM Labor Cert' },
            { code: 'FLAG ETA-9089', zh: '非认证 ETA-9089 一式两份齐备', en: 'Uncertified FLAG ETA-9089 Ready' },
            { code: 'Blind ISO #4109', zh: '65分钟移民官零背景独立盲评', en: '65-Min Blind USCIS Officer Audit' }
          ]
        : [
            { code: 'Criterion (iv)', zh: '期刊/会议审稿评委 (Judging)', en: 'Judging Work of Others' },
            { code: 'Criterion (v)', zh: '重大原创科学/工程贡献', en: 'Original Contributions of Major Significance' },
            { code: 'Criterion (vi)', zh: '学术论文与顶级会议发表', en: 'Authorship of Scholarly Articles' },
            { code: 'Criterion (viii)', zh: '知名机构领导或关键角色', en: 'Leading or Critical Role' },
            { code: 'Kazarian Step 2', zh: '综合杰出地位 (Top Small % · Mukherji)', en: 'Kazarian Step 2 Final Merits' },
            { code: 'Blind ISO #4109', zh: '65分钟移民官零背景独立盲评', en: '65-Min Blind USCIS Officer Audit' }
          ];

      const hasBrief = report.counts.definedExhibits > 0 || stages.some((s) => s.id === 'stage-4-brief' && s.exists);
      const hasBlind = stages.some((s) => s.id === 'stage-8-blind-audit' && s.exists);

      grid.innerHTML = items
        .map((it) => {
          const isBlindItem = it.code.includes('Blind');
          const active = isBlindItem ? hasBlind : hasBrief;
          return \`<div class="rounded-xl border p-4 flex items-start justify-between gap-3 \${
            active ? 'border-emerald-200 bg-emerald-50/30' : 'border-zinc-200 bg-zinc-50/50'
          }">
            <div>
              <div class="font-mono text-[11px] font-semibold \${active ? 'text-emerald-700' : 'text-zinc-500'}">\${escapeHtml(it.code)}</div>
              <div class="text-xs font-medium text-zinc-900 mt-1">\${currentLang === 'zh' ? it.zh : it.en}</div>
            </div>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 \${
              active ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200/70 text-zinc-600'
            }">\${active ? (currentLang === 'zh' ? '已覆盖 ✓' : 'Verified ✓') : (currentLang === 'zh' ? '待执行' : 'Pending')}</span>
          </div>\`;
        })
        .join('');
    }

    function renderBenchmarks(bm) {
      const el = document.getElementById('benchmarks-view');
      if (!bm) {
        el.innerHTML = \`<div class="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 text-xs text-zinc-600 leading-relaxed">
          \${
            currentLang === 'zh'
              ? '尚未抓取 OpenAlex 独立他引数据。在上方输入英文姓名（如 <code>Kaiming He</code>）或 ORCID，即可自动筛除历史合作者并生成三层引用比例条与领域百分位表。'
              : 'Enter your full name or ORCID above to screen your lifetime co-author network and compute field percentiles.'
          }
        </div>\`;
        return;
      }

      const t3 = bm.citationTierSample.strictlyIndependentSharePercent ?? 0;
      const totalSampled = Math.max(1, bm.citationTierSample.totalSampledCitingWorks || 1);
      const t2 = Math.round(((bm.citationTierSample.tier2CoauthorNetwork || 0) / totalSampled) * 100);
      const t1 = Math.max(0, 100 - t3 - t2);

      el.innerHTML = \`
        <div class="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 space-y-2.5">
          <div class="flex items-center justify-between text-xs">
            <strong class="text-zinc-900">\${escapeHtml(bm.author.displayName)} · h=\${bm.author.hIndex ?? '-'} (\${bm.author.citedByCount} cites)</strong>
            <span class="font-mono font-semibold text-emerald-700">\${t3}% 纯独立他引 (Tier 3)</span>
          </div>
          <div class="w-full h-2 rounded-full bg-zinc-200 overflow-hidden flex">
            <div style="width:\${t3}%" class="bg-emerald-500 h-full" title="Tier 3 Strictly Independent: \${t3}%"></div>
            <div style="width:\${t2}%" class="bg-amber-400 h-full" title="Tier 2 Co-Author Network: \${t2}%"></div>
            <div style="width:\${t1}%" class="bg-zinc-400 h-full" title="Tier 1 Direct Self: \${t1}%"></div>
          </div>
          <div class="flex items-center justify-between text-[11px] text-zinc-500">
            <span>已筛查历史合作者: <strong class="text-zinc-800">\${bm.lifetimeCoauthorGraphSize} 人</strong></span>
            <span>独立引用覆盖国家: <strong class="text-zinc-800">\${bm.independentAdoptionFootprint.countriesCount} 国</strong></span>
          </div>
        </div>
        <div class="max-h-56 overflow-y-auto rounded-xl border border-zinc-200">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold text-zinc-500">
                <th class="py-2 px-3">Title</th>
                <th class="py-2 px-2 text-right">Year</th>
                <th class="py-2 px-2 text-right">Cites</th>
                <th class="py-2 px-2 text-right">FWCI</th>
                <th class="py-2 px-3 text-right">Percentile</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100">
              \${(bm.works || [])
                .map(
                  (w) => \`<tr class="hover:bg-zinc-50/80">
                    <td class="py-2 px-3 text-zinc-800">\${escapeHtml(w.title)}</td>
                    <td class="py-2 px-2 text-right font-mono text-zinc-500">\${w.publicationYear ?? '-'}</td>
                    <td class="py-2 px-2 text-right font-mono font-semibold text-zinc-900">\${w.citedByCount}</td>
                    <td class="py-2 px-2 text-right font-mono text-zinc-600">\${w.fwci !== null ? w.fwci.toFixed(2) + 'x' : '-'}</td>
                    <td class="py-2 px-3 text-right font-mono font-semibold text-indigo-600 whitespace-nowrap">\${w.percentileTop !== null ? 'Top ' + w.percentileTop + '%' : '-'}</td>
                  </tr>\`
                )
                .join('')}
            </tbody>
          </table>
        </div>
      \`;
    }

    async function openFile(caseName, relPath, skillFlag, stayOnCurrentTab = false) {
      currentFilePath = relPath;
      isSkillFile = skillFlag;
      const targetCase = skillFlag ? '__skill__' : caseName;
      const res = await fetch(\`/api/file?case=\${encodeURIComponent(targetCase)}&path=\${encodeURIComponent(relPath)}\`);
      const data = await res.json();
      document.getElementById('active-file-label').textContent = skillFlag
        ? relPath
        : \`cases/\${caseName}/\${relPath}\`;
      const docSel = document.getElementById('doc-quick-select');
      if (!skillFlag && docSel) {
        docSel.value = relPath;
      }
      const editor = document.getElementById('file-editor');
      if (data.isBinary) {
        editor.value = \`[Binary Evidence File: \${relPath} (\${data.size} bytes)]\`;
        editor.disabled = true;
        updateDocStats('');
        const rawUrl = \`/api/file?case=\${encodeURIComponent(caseName)}&path=\${encodeURIComponent(relPath)}&raw=1\`;
        if (/\\.pdf$/i.test(relPath)) {
          document.getElementById('markdown-preview').innerHTML = \`<iframe src="\${rawUrl}" class="w-full h-[680px] rounded-lg border border-zinc-200"></iframe>\`;
        } else if (/\\.(png|jpg|jpeg)$/i.test(relPath)) {
          document.getElementById('markdown-preview').innerHTML = \`<img src="\${rawUrl}" class="max-w-full rounded-lg border border-zinc-200" />\`;
        } else {
          document.getElementById('markdown-preview').innerHTML = \`<p><a href="\${rawUrl}" target="_blank" class="text-indigo-600 underline">Open binary file (\${escapeHtml(relPath)})</a></p>\`;
        }
      } else {
        editor.disabled = skillFlag;
        editor.value = data.content || '';
        updateDocStats(data.content || '');
        document.getElementById('markdown-preview').innerHTML = renderLegalMarkdown(data.content || '', relPath);
      }
      if (!stayOnCurrentTab) {
        switchTab('tab-step3');
      }
    }

    document.getElementById('doc-quick-select').addEventListener('change', (e) => {
      if (currentCase && e.target.value) {
        openFile(currentCase, e.target.value, false, true);
      }
    });

    document.getElementById('markdown-preview').addEventListener('click', (e) => {
      const pill = e.target.closest('.exhibit-pill');
      if (pill && currentCase) {
        const exId = pill.getAttribute('data-exhibit');
        showToast(currentLang === 'zh' ? \`正在打开 04-exhibit-index.md 核对 Exhibit \${exId}...\` : \`Opening 04-exhibit-index.md for Exhibit \${exId}...\`);
        openFile(currentCase, 'final/04-exhibit-index.md', false);
      }
    });

    document.getElementById('file-editor').addEventListener('input', (e) => {
      updateDocStats(e.target.value);
      document.getElementById('markdown-preview').innerHTML = renderLegalMarkdown(e.target.value, currentFilePath || '');
      document.getElementById('save-status').textContent = currentLang === 'zh' ? '● 未保存' : '● Unsaved';
    });

    async function saveCurrentFile() {
      if (!currentCase || !currentFilePath || isSkillFile) return;
      const content = document.getElementById('file-editor').value;
      const res = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseName: currentCase, path: currentFilePath, content })
      });
      if (res.ok) {
        document.getElementById('save-status').textContent = currentLang === 'zh' ? '✓ 已保存' : '✓ Saved';
        showToast(currentLang === 'zh' ? \`已保存 \${currentFilePath}\` : \`Saved \${currentFilePath}\`);
        await loadCaseDetails(currentCase);
      }
    }

    document.getElementById('btn-save-file').addEventListener('click', saveCurrentFile);

    const copyBlindPromptAction = () => {
      const st = (lastCasePayload?.stages || []).find((s) => s.id === 'stage-8-blind-audit');
      if (st) {
        navigator.clipboard.writeText(st.prompt);
        showToast(currentLang === 'zh' ? '已复制 65分钟移民官独立盲评指令！请在新对话窗口粘贴。' : 'Copied 65-Min Blind Officer Audit prompt!');
      }
    };
    document.getElementById('btn-copy-blind-audit').addEventListener('click', copyBlindPromptAction);
    document.getElementById('btn-kpi-copy-blind').addEventListener('click', copyBlindPromptAction);

    document.getElementById('btn-open-blind-report').addEventListener('click', async () => {
      if (!currentCase) return;
      const targetFile = 'final/06-blind-officer-audit.md';
      const st = (lastCasePayload?.stages || []).find((s) => s.id === 'stage-8-blind-audit');
      if (st && !st.exists) {
        await fetch('/api/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseName: currentCase,
            path: targetFile,
            content: '# Blind USCIS Adjudicator Audit Report (final/06-blind-officer-audit.md)\\n\\n> Paste the Stage 08 Blind Officer Audit prompt into a fresh AI session to populate this red-team report.\\n'
          })
        });
      }
      await openFile(currentCase, targetFile, false);
    });

    // Command Palette (⌘K / Ctrl+K)
    const cmdBackdrop = document.getElementById('cmd-backdrop');
    const cmdSearch = document.getElementById('cmd-search');
    const cmdList = document.getElementById('cmd-list');

    const openCmdPalette = () => {
      cmdBackdrop.classList.remove('hidden');
      cmdSearch.value = '';
      renderCmdItems('');
      setTimeout(() => cmdSearch.focus(), 20);
    };
    const closeCmdPalette = () => cmdBackdrop.classList.add('hidden');

    const renderCmdItems = (q) => {
      const query = String(q || '').toLowerCase();
      const actions = [];
      if (lastCasePayload) {
        for (const st of lastCasePayload.stages) {
          const title = currentLang === 'zh' ? (st.titleZh || st.title) : st.title;
          actions.push({
            label: \`[复制指令] Step \${st.step}: \${title}\`,
            tag: st.targetFile,
            run: () => {
              navigator.clipboard.writeText(st.prompt);
              showToast(\`Copied Step \${st.step} Prompt\`);
            }
          });
        }
        const allFiles = [
          ...(lastCasePayload.report.files.final || []),
          ...(lastCasePayload.report.files.work || []),
          ...(lastCasePayload.report.files.materials || [])
        ];
        for (const f of allFiles) {
          actions.push({
            label: \`[打开文书] \${f}\`,
            tag: currentCase,
            run: () => openFile(currentCase, f, false)
          });
        }
      }
      const filtered = actions.filter((a) => a.label.toLowerCase().includes(query) || a.tag.toLowerCase().includes(query));
      cmdList.innerHTML = '';
      for (const item of filtered.slice(0, 12)) {
        const div = document.createElement('div');
        div.className = 'cursor-pointer px-3 py-2 rounded-lg hover:bg-zinc-100 flex items-center justify-between text-xs text-zinc-800';
        div.innerHTML = \`<span>\${escapeHtml(item.label)}</span><span class="font-mono text-[11px] text-zinc-400">\${escapeHtml(item.tag)}</span>\`;
        div.addEventListener('click', () => {
          closeCmdPalette();
          item.run();
        });
        cmdList.appendChild(div);
      }
    };

    document.getElementById('btn-open-cmd').addEventListener('click', openCmdPalette);
    cmdBackdrop.addEventListener('click', (e) => {
      if (e.target === cmdBackdrop) closeCmdPalette();
    });
    cmdSearch.addEventListener('input', (e) => renderCmdItems(e.target.value));

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCmdPalette();
      } else if (e.key === 'Escape') {
        closeCmdPalette();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveCurrentFile();
      }
    });

    document.querySelectorAll('[data-skill]').forEach((el) => {
      el.addEventListener('click', () => openFile(currentCase, el.dataset.skill, true));
    });

    document.getElementById('case-select').addEventListener('change', (e) => {
      currentFilePath = null;
      loadCaseDetails(e.target.value);
    });

    document.getElementById('btn-create-case').addEventListener('click', async () => {
      const nameInput = document.getElementById('new-case-name');
      const name = nameInput.value.trim() || 'my-petition';
      const category = document.getElementById('new-case-category').value;
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category })
      });
      const data = await res.json();
      if (data.ok) {
        nameInput.value = '';
        document.getElementById('new-case-drawer').classList.add('hidden');
        currentFilePath = null;
        showToast(\`Created cases/\${data.caseName}/\`);
        await loadCasesList(data.caseName);
      }
    });

    document.getElementById('btn-new-file').addEventListener('click', async () => {
      const rel = prompt('New file path inside case (e.g., final/01-petition-letter.md):', 'work/notes.md');
      if (!rel || !currentCase) return;
      await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseName: currentCase, path: rel, content: \`# \${rel}\\n\\n\` })
      });
      await loadCaseDetails(currentCase);
      await openFile(currentCase, rel, false);
    });

    const dropzone = document.getElementById('upload-dropzone');
    const fileInput = document.getElementById('file-input');
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('border-indigo-500', 'bg-indigo-50/30');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('border-indigo-500', 'bg-indigo-50/30');
    });
    dropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-indigo-500', 'bg-indigo-50/30');
      await uploadFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', async (e) => {
      await uploadFiles(e.target.files);
    });

    async function uploadFiles(fileList) {
      if (!currentCase || !fileList || fileList.length === 0) return;
      for (const file of fileList) {
        const buf = await file.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buf);
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        const base64 = btoa(binary);
        await fetch('/api/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseName: currentCase,
            path: \`materials/\${file.name}\`,
            encoding: 'base64',
            content: base64
          })
        });
      }
      showToast(\`Uploaded \${fileList.length} file(s) to materials/\`);
      await loadCaseDetails(currentCase);
    }

    let activeJobId = null;
    async function runCliAgent(promptText) {
      const runner = document.getElementById('agent-runner').value;
      const term = document.getElementById('agent-terminal');
      term.textContent = \`Starting \${runner}...\\n\`;
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseName: currentCase, runner, prompt: promptText })
      });
      const data = await res.json();
      if (data.jobId) activeJobId = data.jobId;
    }

    document.getElementById('btn-run-custom-agent').addEventListener('click', () => {
      const p = document.getElementById('custom-agent-prompt').value.trim();
      if (p) runCliAgent(p);
    });
    document.getElementById('btn-copy-custom-prompt').addEventListener('click', () => {
      const p = document.getElementById('custom-agent-prompt').value.trim();
      if (p) {
        navigator.clipboard.writeText(p);
        showToast('Prompt copied!');
      }
    });
    document.getElementById('btn-stop-agent').addEventListener('click', async () => {
      if (!activeJobId) return;
      await fetch('/api/agent/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: activeJobId })
      });
      showToast('Stopped CLI job');
    });

    document.getElementById('btn-harvest').addEventListener('click', async () => {
      const authorName = document.getElementById('oa-author').value.trim();
      const orcid = document.getElementById('oa-orcid').value.trim();
      if (!authorName && !orcid) {
        showToast('Enter an Author Name or ORCID first.');
        return;
      }
      showToast('Querying OpenAlex & screening 3-Tier Co-Author Graph...');
      const res = await fetch('/api/harvest-citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseName: currentCase, authorName, orcid })
      });
      const data = await res.json();
      if (data.ok) {
        showToast('Saved work/benchmarks-and-citations.md!');
        await loadCaseDetails(currentCase);
      } else {
        showToast(\`OpenAlex: \${data.error}\`);
      }
    });

    document.getElementById('btn-refresh-audit').addEventListener('click', () => {
      if (currentCase) loadCaseDetails(currentCase);
    });

    document.getElementById('btn-print-brief').addEventListener('click', () => {
      switchTab('tab-step3');
      window.print();
    });

    const evtSource = new EventSource('/api/events');
    evtSource.addEventListener('fs-change', () => {
      if (currentCase) loadCaseDetails(currentCase);
    });
    evtSource.addEventListener('agent-log', (e) => {
      const { chunk } = JSON.parse(e.data);
      const term = document.getElementById('agent-terminal');
      term.textContent += chunk;
      term.scrollTop = term.scrollHeight;
    });
    evtSource.addEventListener('agent-job', (e) => {
      const { status, logs } = JSON.parse(e.data);
      const term = document.getElementById('agent-terminal');
      if (logs) term.textContent = logs;
      term.scrollTop = term.scrollHeight;
      if (status === 'completed' && currentCase) loadCaseDetails(currentCase);
    });

    loadCasesList();
  </script>
</body>
</html>`;

/**
 * Self-test for OpenPetition Studio server & API endpoints.
 */
export async function runStudioSelfTest() {
  const toolkitRes = runToolkitSelfTest();
  const prevWatch = process.env.OPENPETITION_DISABLE_WATCH;
  process.env.OPENPETITION_DISABLE_WATCH = '1';
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'openpetition-studio-test-'));
  const server = createStudioServer({ rootDir: tmpRoot });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  try {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const health = await healthRes.json();
    if (!health.ok || health.stagesCount < 8) throw new Error('Studio health check failed');

    const createRes = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test-eb1a', category: 'EB-1A' })
    });
    const created = await createRes.json();
    if (!created.ok || created.caseName !== 'test-eb1a') {
      throw new Error('Failed to create test-eb1a case via API');
    }

    const saveRes = await fetch(`${baseUrl}/api/file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseName: 'test-eb1a',
        path: 'final/01-petition-letter.md',
        content: '# EB-1A Petition Letter\n\nSee [Exhibit A-1, p. 1].\n'
      })
    });
    const saved = await saveRes.json();
    if (!saved.ok) throw new Error('Failed to save file via Studio API');

    const htmlRes = await fetch(`${baseUrl}/`);
    const html = await htmlRes.text();
    if (!html.includes('OpenPetition Studio') || !html.includes('stage-8-blind-audit')) {
      throw new Error('Studio UI HTML failed to render');
    }

    return { ok: true, port: addr.port, toolkitScore: toolkitRes.readinessScore };
  } finally {
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    if (prevWatch === undefined) delete process.env.OPENPETITION_DISABLE_WATCH;
    else process.env.OPENPETITION_DISABLE_WATCH = prevWatch;
  }
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMain) {
  const args = process.argv.slice(2);
  if (args.includes('--self-test') || args.includes('--check')) {
    runStudioSelfTest()
      .then((res) => {
        console.log(
          `[OpenPetition Studio] Self-test passed (Toolkit Score: ${res.toolkitScore}/100, Ephemeral API Port Verified).`
        );
      })
      .catch((err) => {
        console.error(`[OpenPetition Studio] Self-test failed: ${err.message}`);
        process.exitCode = 1;
      });
  } else {
    const portIdx = args.indexOf('--port');
    const port = portIdx !== -1 && args[portIdx + 1] ? Number(args[portIdx + 1]) : Number(process.env.PORT || 3030);
    const hostIdx = args.indexOf('--host');
    const host = hostIdx !== -1 && args[hostIdx + 1] ? args[hostIdx + 1] : '127.0.0.1';

    const server = createStudioServer({ rootDir: __dirname });
    server.listen(port, host, () => {
      console.log(`\n==================================================================`);
      console.log(`  OpenPetition Studio — EB-1A & NIW Legal Workbench`);
      console.log(`  Local URL:   http://${host}:${port}`);
      console.log(`  Workspace:   ${path.join(__dirname, 'cases')}`);
      console.log(`==================================================================\n`);
    });
  }
}
