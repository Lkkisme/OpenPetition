# Active Benchmarking & Objective Evidence Research

Do not rely solely on whatever files the applicant initially places in `materials/`. Most applicants only upload their CV and a few papers or offer letters, leaving out the **third-party objective benchmarks** that USCIS officers require to evaluate "major significance," "high remuneration," "distinguished reputation," and "top of the field."

Use the bundled zero-dependency CLI tool (`node scripts/petition-toolkit.mjs harvest-citations`), web search, and public APIs to gather and document these benchmarks in `work/benchmarks-and-citations.md`.

---

## 1. Four-Axis Evidence Quality Framework (`8 C.F.R. § 103.2(b)(2)`)

Before relying on any factual assertion, evaluate its supporting evidence across four axes:
1. **Basis:** `Documented` (backed by an uploaded exhibit or verified public benchmark) | `Inferred` | `Unsupported`
2. **Regulatory Evidence Tier (`8 C.F.R. § 103.2(b)(2)`):**
   - `Primary Evidence` (official certificates, published articles, USPTO patents, W-2s, editor review confirmations, OpenAlex/BLS records)
   - `Secondary Evidence` (institutional records when primary is unavailable)
   - `Affidavit / Letter` (expert or supervisor letters—USCIS penalizes relying on letters alone to prove a fact where primary evidence is reasonably available)
3. **Independence Tier:** `Strictly Independent` | `Co-Author / Collaborator Network` | `Supervisor / Employer` | `Self-Authored`
4. **Filing Status:** `Verified in Exhibit` | `Pending Collection`

---

## 2. Three-Tier Independent-Citation Filtering & Percentile Engine

Relying on raw Google Scholar screenshots invites RFEs when officers suspect self-citation inflation or argue that raw counts lack field context. Build a multi-source citation audit using **OpenAlex** and **Semantic Scholar**:

### A. Three-Tier Lifetime Co-Author Graph Filter
USCIS officers and AAO appeals distinguish between direct self-citations and co-author network citations. Classify every inbound citing paper ($W_{\text{citing}}$):
1. **Build the Applicant's Lifetime Co-Author Set ($C_{\text{lifetime}}$):**
   - Query `https://api.openalex.org/works?filter=author.id:<OpenAlex_Author_ID>&per_page=200`
   - Collect all unique co-author IDs across the applicant's entire publication history into $C_{\text{lifetime}}$.
2. **Classify Each Citing Work:**
   - **Direct Self-Citation:** Applicant is an author of $W_{\text{citing}}$.
   - **Co-Author Network Citation:** Applicant is not an author of $W_{\text{citing}}$, but at least one author of $W_{\text{citing}}$ is in $C_{\text{lifetime}}$.
   - **Strictly Independent External Citation:** Zero overlap between $\text{Authors}(W_{\text{citing}})$ and $\{\text{Applicant}\} \cup C_{\text{lifetime}}$.
3. **Report Both Totals and Strictly Independent Ratios** in `work/benchmarks-and-citations.md` and the Petition Letter.

### B. Year- & Subfield-Normalized Percentiles via OpenAlex
OpenAlex computes field-weighted, year-normalized percentiles natively on every work record (`GET https://api.openalex.org/works/<Work_ID_or_DOI>`):
- **`citation_normalized_percentile`:**
  - `value` (e.g., `0.994` = 99.4th percentile in the same subfield and publication year)
  - `is_in_top_1_percent` (`true` / `false`)
  - `is_in_top_10_percent` (`true` / `false`)
- **`fwci` (Field-Weighted Citation Impact):** Ratio of the paper's actual citations to the world average for works of the same publication year, document type, and OpenAlex subfield (`1.0` = world average; `3.5` = 3.5× world average).
- **2-Year Citation Velocity vs. Journal Impact Factor:** Compare each paper's citations accrued within 2 years of publication against the publishing journal's 2-year Impact Factor (e.g., showing a paper received 45 citations in 24 months in a journal whose average paper receives 6.2).

### C. Corporate, Government & Global Citing Institution Aggregations
Use OpenAlex server-side `group_by` aggregations on citing works (`?filter=cites:W1|W2|W3`):
- **By Institution Type (`&group_by=authorships.institutions.type`):**
  - Breaks citing institutions into ROR categories: `education` (universities), `company` (corporate R&D labs such as Google, Microsoft, IBM, Pfizer, Samsung), `government` / `facility` (NIH, DOE National Labs, NASA, CERN), and `healthcare` (Mayo Clinic, MGH, Cleveland Clinic).
  - Citing papers from **`company`**, **`government`**, and **`healthcare`** institutions are premier evidence for **NIW Prong 1 (National Importance)** and **EB-1A Criterion (v) (Major Significance)**.
- **By Country (`&group_by=authorships.institutions.country_code`):**
  - Quantifies the number of countries and continents relying on the applicant's work to demonstrate **international acclaim** at EB-1A Step 2.

### D. Citing-Sentence & Intent Extraction via Semantic Scholar Academic Graph
To prove *how* independent peers rely on the applicant's work (`8 C.F.R. § 204.5(h)(3)(v)`), query the Semantic Scholar API:
- `GET https://api.semanticscholar.org/graph/v1/paper/<Paper_ID_or_DOI>/citations?fields=contexts,intents,isInfluential,citingPaper.title,citingPaper.year,citingPaper.venue,citingPaper.authors`
- Prioritize citing papers where:
  - `isInfluential == true` (methodological or foundational reliance), or
  - `intents` includes `"Method"` or `"Result"` (rather than routine `"Background"`), and
  - `contexts` provides the exact verbatim sentences surrounding the in-text citation marker (e.g., *"We adopt the sparse routing kernel of [Applicant et al.] to reduce latency by 38%..."*).

### E. Recommender Independence Verification
For every candidate independent recommender, verify via OpenAlex:
1. **Zero shared publications** with the applicant;
2. **Zero shared publications** with the applicant's PhD/postdoc advisors; and
3. **No overlapping institutional affiliation dates** with the applicant.

---

## 3. Venue Selectivity & Journal / Conference Standing

For Criterion (vi) (Scholarly Articles), Criterion (iv) (Judging), and Step 2 Final Merits, document the standing of every journal and conference:
- **Journals:** Impact Factor, 5-year Impact Factor, JCR / Scopus Quartile (`Q1`, plus exact rank such as `#4 of 168 in Artificial Intelligence`), and Google Scholar Metrics `h5-index`.
- **Conferences (CS, AI/ML, ECE, Systems):** Explicitly note in the brief (citing `6 USCIS-PM F.2`) that in computer science and engineering, peer-reviewed flagship conferences (NeurIPS, ICML, ICLR, CVPR, OSDI, SOSP, SIGCOMM, ISCA, IEEE S&P, CCS, ACL, KDD) are premier publication venues more selective than most journals. Record the exact **acceptance rate** (`accepted / submitted`), CORE tier (`CORE A*`), and `h5-index` rank.

---

## 4. Salary & Remuneration Benchmarking (`8 C.F.R. § 204.5(h)(3)(ix)`)

Match the applicant's compensation across **Occupation (6-digit SOC code)**, **Geographic Area (MSA)**, and **Year** using at least two sources:
1. **BLS OEWS:** Record the 50th, 75th, and **90th percentile** annual wage for the exact SOC code and metropolitan area (plus national data).
2. **DOL OFLC Wage Library (FLAG):** Record Level I–IV prevailing wages (**Level IV = 67th percentile / Senior**) and mean wage for the exact SOC code and county/MSA.
3. **Industry Compensation Surveys:** Supplement government base-wage tables with reputable level-matched surveys (Levels.fyi, Carta, Radford, AAMC) when total compensation includes substantial bonuses or W-2 verified vested equity. Always separate **Base Salary**, **Paid Bonus**, and **Vested Equity (W-2 Box 1/5)** from unvested paper grants.
