# OpenPetition

[English](README.md) | **简体中文**

面向 **EB-1A（杰出人才）** 与 **EB-2 NIW（国家利益豁免）** 自主申请的本地工作区、零依赖 **AI 指挥台与文书工作台（OpenPetition Studio）** 及 **AI Agent 技能**（`$openpetition`）。

既可在 **Codex**、**Claude Code**、**Cursor**、**Antigravity** 中直接通过 AI 对话推进全流程，也可一键启动本地可视化工作台（`node studio.mjs`），完成 OpenAlex 三层合作者网络去重与引用分位检索、资格评估、赴美工作计划、去模板化推荐信、I-140 呈请信（Petition Letter）、双向超链接证据封面编译、表格防退件核查与 RFE 补件应答。

---

## 快速开始

### 1. 获取本仓库

```bash
git clone https://github.com/Lkkisme/OpenPetition.git
cd OpenPetition
```

或者点击页面右上角的 **Code → Download ZIP** 下载解压。

### 2. 放入申请材料

在 `cases/` 下创建一个直观的案件目录（`cases/` 已被 `.gitignore` 忽略，不会进入 Git），将现有材料放入 `materials/`：

```text
cases/
  my-eb1a/                 # 或 cases/my-niw/
    materials/             # 简历 CV、Google Scholar PDF、论文、专利、开源/产品数据、审稿记录、获奖证明、薪资单等
```

也可以通过命令行一键初始化标准目录结构：

```bash
node scripts/petition-toolkit.mjs init cases/my-eb1a --category EB-1A
```

### 3. 方式 A — 启动本地可视化 AI 指挥台（`OpenPetition Studio`）

仅需 Node.js 原生环境（零 `npm install` 第三方依赖）：

```bash
node studio.mjs
```

浏览器打开 **`http://127.0.0.1:3030`**：
- **实时磁盘同步（Live Disk Sync）：** 直接读写 `cases/<case-name>/` 下的真实文件；当外部 AI 编程助手（Codex、Claude Code、Cursor、Antigravity）修改文书时，界面通过 SSE 自动实时刷新。
- **8 阶段 AI Agent 任务流调度：** 一键复制针对当前案件上下文的 `$openpetition` 阶段提示词，或在界面内直接拉起本地 CLI Agent（`codex exec`、`claude -p`）并实时查看终端输出流。
- **OpenAlex 三层终身合作者网络去重与分位数采集：** 自动构建申请人**终身合著者网络（Lifetime Co-Author Graph）**，将施引文献严格划分为**纯独立引用（Tier 3）**、**合著者网络引用（Tier 2）**与**自引（Tier 1）**，提取同年同子领域引用分位数（`citation_normalized_percentile`、`fwci`）及高校/企业/政府机构采纳分布。
- **递交前自动体检与推荐信相似度雷达：** 自动核对正文中所有 `[Exhibit X, p. Y]` 引用与证据目录的一致性及页码精确度、拦截遗留 `[TODO]` 或类别串词（Category Bleed）、扫描 AI 套话，并计算推荐信之间的 **6-词 Shingle Jaccard 相似度**（控制 `< 12%`）。
- **双栏法律呈请书编辑与一键 PDF 导出：** 左侧编辑 Markdown 源码，右侧实时渲染带 `[Exhibit B-1, p. 2]` 高亮标签的法律呈请书排版，支持一键打印/导出为符合 USCIS 装订留白规范的 PDF。

### 4. 方式 B — 在 AI 编程助手中直接对话

用 **Codex**、**Claude Code**、**Cursor** 或 **Antigravity** 打开 `OpenPetition` 目录直接对话（也可输入 `$openpetition` 调用技能）：

- **可行性评估、客观数据补全与补强计划：**
  > 请读取 `cases/my-eb1a/materials` 中的材料，主动检索缺失的期刊/会议指标、独立施引上下文或薪资对比数据，输出一份 EB-1A 评估报告（`final/00-assessment.md`），梳理最有力的申请主张、Final Merits 的优势与薄弱点，并列出优先补充的证据清单。

- **EB-2 NIW 赴美计划、个人陈述与呈请信起草：**
  > 我准备用 `cases/my-niw/materials` 申请 EB-2 NIW。请先读取材料并帮我凝练具体的赴美工作计划（Proposed Endeavor），随后起草个人陈述（`final/02-personal-statement.md`）、证据目录（`final/04-exhibit-index.md`）以及完整的 I-140 Petition Letter（`final/01-petition-letter.md`）。

- **推荐人组合规划与去模板化推荐信起草：**
  > 请基于 `cases/my-eb1a` 的证据，帮我规划独立推荐人与合作推荐人的分工（`final/03-recommendation-letters/00-recommender-plan.md`），并为每位推荐人起草视角、结构和语气完全不同的推荐信草稿。

- **RFE / NOID 补件回复：**
  > 已递交文书在 `cases/my-eb1a/final`，新收到的 USCIS RFE 通知在 `cases/my-eb1a/post-filing/notice`。请逐项拆解质疑点，结合现有与新增证据起草 RFE 回复呈请书。

---

## 命令行确定性工具集（`scripts/petition-toolkit.mjs`）

```bash
# 1. 初始化案件目录
node scripts/petition-toolkit.mjs init cases/my-eb1a --category EB-1A

# 2. 采集 OpenAlex 引用分位数并执行三层终身合作者网络独立引用筛查
node scripts/petition-toolkit.mjs harvest-citations --author "Your Name" --case cases/my-eb1a

# 3. 执行递交前体检（核查 Exhibit 交叉引用、页码定位、类别串词、AI 套话及推荐信相似度）
node scripts/petition-toolkit.mjs audit-case --case cases/my-eb1a
```

---

## 全流程覆盖能力

| 模块 | 具体能力 |
| :--- | :--- |
| **证据盘点与三层引用基准检索 (`work/`)** | 解析 `materials/` 中的 PDF、Word、图片、邮件；自动采集 OpenAlex `citation_normalized_percentile` 与 `fwci`，筛除自引及合作者网络引用，核对 BLS OEWS 90 分位与 DOL OFLC Level IV 薪资基准。 |
| **案件评估 (`final/00-assessment.md`)** | 适配**学术科研**、**工业界工程师/架构师**、**创业者/创始人**、**临床医生/应用专家**；基于 `8 C.F.R. § 103.2(b)(2)` 四维证据矩阵评估主客观证明力，预判 TSC/NSC 审案官常见质疑点。 |
| **I-140 呈请信 (`final/01-petition-letter.md`)** | 锚定 *Matter of Chawathe*（优势证据标准）、*Kazarian*、*Matter of Dhanasar*、2023–2025 USCIS Policy Manual 最新修订（`PA-2023-26`、`PA-2024-24`、`PA-2025-03`）及联邦法院判例（含 2026 年 *Mukherji v. Miller*、*Chursov*、*Rubin*、*Buletini*、*Muni*）。 |
| **个人陈述 / 赴美工作计划 (`final/02-personal-statement.md`)** | 起草申请人第一人称签署的未来工作计划（EB-1A § 204.5(h)(5)）或 NIW Proposed Endeavor 陈述（含 1–3 年具体技术/研发/业务路线图）。 |
| **推荐信组合与反模板校验 (`final/03-recommendation-letters/`)** | 严格区分零合作交集的独立专家与核心圈专家，通过 6-词 Shingle Jaccard 相似度检测（`< 12%`）杜绝模板化同质推荐信。 |
| **双向超链接证据包与防退件清单 (`final/04-exhibit-index.md`, `05-filing-checklist.md`)** | 生成编号证据目录与黑白扫描防丢重点高亮指引；提供 `templates/latex-exhibit-engine.tex` 自动生成标注“正文引用页码”的 Exhibit Cover Sheet；严格核对 I-140 自申请人字段（Part 1 Q5=`No`/Q6=`Yes` 适用 $300 Asylum Program Fee 减免、NIW 三部分未认证 FLAG ETA-9089 签名规范）。 |
| **RFE / NOID 补件应答 (`post-filing/`)** | 逐句拆解移民官质疑，识别 *Kazarian* 第一步与第二步混淆或 *Chawathe* 举证标准越界，严守 `8 C.F.R. § 103.2(b)(1)` 优先日时间截点，输出针对性回复呈请书。 |

---

## 目录结构

```text
OpenPetition/
├── AGENTS.md                                                    # Codex / Cursor / Antigravity 入口
├── CLAUDE.md                                                    # Claude Code 入口
├── studio.mjs                                                   # 零依赖本地 AI 指挥台与文书工作台 (http://127.0.0.1:3030)
├── scripts/
│   └── petition-toolkit.mjs                                     # OpenAlex 三层独立引用采集与递交前文书体检 CLI
├── templates/
│   └── latex-exhibit-engine.tex                                 # 双向超链接 LaTeX 呈请书与证据封面编译模板
├── .agents/skills/openpetition/
│   ├── SKILL.md                                                 # 核心工作流、主动背景检索与证据规范
│   └── references/
│       ├── eb1a.md                                              # EB-1A 法规标准、2023-2024 政策更新与联邦判例库
│       ├── niw.md                                               # EB-2 资格、Dhanasar 三要素与 2025.01 最新政策指引
│       ├── benchmarking-and-evidence-research.md                # 三层合著者去重、OpenAlex 引用分位与 BLS/OFLC 薪资基准
│       ├── recommendation-letters-and-statements.md             # 推荐人独立性核验、Shingle 反模板规则与个人陈述指南
│       ├── workspace-and-deliverables.md                        # 案件目录规范、证据重点高亮与交付文书规格
│       └── filing-forms-and-rfe.md                              # I-140/ETA-9089 填表防坑、Lockbox 装订与 RFE/NOID 指南
└── cases/                                                       # Git 忽略的本地私人案件目录
    └── <case-name>/
        ├── materials/                                           # 原始材料（只读）
        ├── work/                                                # 证据索引、客观指标检索与体检报告
        ├── final/                                               # 评估报告、Petition Letter、个人陈述、推荐信、证据目录
        └── post-filing/                                         # RFE / NOID 通知与回复文书
```

---

## 隐私与免责声明

- **本地存储：** `cases/` 目录默认被 Git 忽略，个人材料保留在本地磁盘。
- **模型隐私：** AI Agent 会将上下文发送给所配置的模型服务商；处理含敏感身份信息的文档前，请确认所用工具的数据隐私设置。
- **非法律代理：** 本项目为开源文书整理工作区、校验工具与 Agent 技能，不构成执业律师法律意见或代理关系，亦不保证申请获批。

## 许可协议

[MIT License](LICENSE)
