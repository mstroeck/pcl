# pcl v0.2 Roadmap

*Synthesized from 3-model planning council (Opus, GPT-5.4, Gemini 2.5 Pro) + human input.*

## Vision

pcl v0.1 proves multi-model consensus planning works. v0.2 makes it **smart, grounded, and production-ready** — plans informed by real research, better consensus algorithms, CI/CD automation, and extensibility.

## Key Differentiators

1. **Research-grounded planning** — deep domain research before planning (not just LLM training data)
2. **Multi-model consensus** — disagreement surfacing, weighted voting, confidence scoring
3. **LLM meta-synthesis** — mechanical dedup + LLM intelligence for coherence
4. **Automation-first** — GitHub Actions, CI policy, machine-readable output

---

## Phase 1: Foundation (P0 — ship first)

### 1. Comprehensive Test Suite
- Unit tests for all modules (deduper, parser, merger, disagreements, config, resolver, cost)
- Integration tests with mocked LLM APIs (full pipeline)
- Snapshot tests for output formatters
- **Gate**: 80%+ coverage before touching consensus engine

### 2. Domain Research (Pre-Planning Intelligence)
- New `src/research/` module — runs deep research on the task/domain BEFORE dispatching to planning models
- Default provider: Perplexity Sonar (`sonar-deep-research`) — configurable via `research.provider` in config
- Research query synthesized from: task description, GitHub issue context, file content
- Research output injected into planning prompt as grounding context
- Configurable: `--research` (on by default), `--no-research` to skip, `--research-provider <provider>`
- Support multiple research providers: Perplexity Sonar, Tavily, Google Search API, or any OpenAI-compatible endpoint
- Token budget management — truncate research to fit within model context limits
- Cache research results (same input = same research, configurable TTL)

### 3. Upgraded Similarity Algorithm
- Replace pure Jaccard with hybrid: fast Jaccard for obvious matches (>0.85), TF-IDF cosine for main comparison
- Optional: LLM-based semantic judgment for borderline cases (uses cheapest configured model)
- Configurable via `consensus.similarity: 'jaccard' | 'tfidf' | 'hybrid'`
- Pre-tokenize with stemming/normalization

### 4. Response Caching
- Cache key: SHA-256(systemPrompt + userPrompt + modelConfig + researchContext)
- Store in `~/.plan-council/cache/` with configurable TTL (default 1h)
- `--no-cache` flag, cache hit/miss status in output
- Massive cost savings during iterative planning

### 5. Improved Error Handling & Partial Failures
- Structured logging (`--log-level debug|info|warn|error`)
- Per-model timeout with graceful degradation
- Better rate limit detection and user notification
- `--dry-run` validates config + estimates cost without API calls

---

## Phase 2: Quality (P1 — consensus improvements)

### 6. Weighted Consensus & Better Merging
- Per-model weight config (`weight: 1.5`)
- Borda count for suggested order merging (replaces "first model wins")
- Category-aware weighting (trust Model X for architecture, Model Y for implementation)
- Cap max weight at 3x to prevent single-model dominance

### 7. Dependency Graph Resolution
- When steps merge across models, resolve dependency IDs to consensus step IDs
- Detect cycles, missing prerequisites
- Topological sort for execution order

### 8. LLM Meta-Synthesis Pass
- After mechanical consensus, optionally pass merged plan to one LLM for:
  - Coherence check (do steps connect logically?)
  - Gap analysis (missing steps between what models proposed?)
  - Better summary generation
  - Dependency validation
- Opt-in: `--synthesize` flag, uses cheapest configured model
- Show original mechanical consensus alongside synthesis

### 9. Centralized Model Registry
- Single source of truth for: aliases, pricing, capabilities, defaults, provider constraints
- Replace scattered metadata across defaults.ts, capabilities.ts, estimator.ts
- Easy to add new models/providers

---

## Phase 3: Ship (P2 — automation & extensibility)

### 10. GitHub Action
- `plan-council/action` — runs on issue creation/labeling
- Posts consensus plan as issue comment
- Configurable triggers (labels, events)
- Cost guardrails (fail if budget exceeded)
- Secrets masking, audit logging

### 11. Plugin Architecture
- Interface-based: `ModelAdapter`, `OutputFormatter`, `InputResolver`, `ResearchProvider`
- Discovery via config entries pointing to npm packages or local paths
- First-party plugins for: Ollama/local models, Linear/Jira export, GitLab resolver

### 12. Rich Output Formats
- Mermaid dependency graph (DAG diagram in markdown)
- HTML report (collapsible sections, D3 visualization)
- Linear/Jira CSV export
- GitHub Project integration
- Versioned output schema for automation stability

### 13. Streaming & Progressive Output
- Show partial results as each model completes
- Real-time cost tracker (actual tokens consumed)
- Early consensus preview as models finish

### 14. Configuration DX
- `pcl doctor` — validate API keys, test connectivity, show model availability
- `pcl config show` — display resolved config
- Config profiles (`--profile fast`, `--profile thorough`)
- Shell completions (bash, zsh, fish)

---

## Phase 4: Stretch (P3 — defer to v0.3 unless time permits)

### 15. Context Enrichment
- Auto-parse project files (package.json, tsconfig, etc.) for tech stack
- Directory structure analysis
- Fetch related PRs/issues for GitHub issue targets
- Secret detection and redaction
- `.plan-council-context` file for persistent project context

### 16. Interactive/REPL Mode
- Show initial plan, allow follow-ups ("expand step 3", "what about security?")
- Plan editing, version tracking, undo/redo
- Re-run affected portions with conversation context

### 17. Plan Versioning & Diffing
- Store history in `.plan-council/history/`
- `pcl diff <plan-a> <plan-b>` — compare plans
- Track which steps were implemented (git commit matching)

### 18. Evaluation Harness
- 20+ benchmark planning tasks with known-good plans
- Metrics: step coverage, decision quality, risk recall
- A/B testing for algorithm changes
- Cost-efficiency tracking

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Research provider | Perplexity Sonar default, configurable | Best deep research quality, but users should choose |
| Similarity algorithm | Hybrid (Jaccard + TF-IDF) | No external deps, major quality upgrade |
| Meta-synthesis | Opt-in (`--synthesize`) | Adds cost/latency, make default in v0.3 after feedback |
| Plugin system | Interface-based, config-discovered | Simple, no complex lifecycle |
| Consensus weights | Configurable per-model, 3x cap | Prevents single-model dominance |
| Order merging | Borda count | Well-established, handles multi-model ranking |
| CI priority | GitHub Actions first | Existing GitHub integration, largest user base |
| Caching | File-based, content-addressable, 1h TTL | Simple, debuggable, no dependencies |

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Scope creep delays release | HIGH | Strict P0 gate — ship Phase 1 first |
| Research adds latency/cost | MEDIUM | Cache results, `--no-research` escape hatch |
| Consensus changes degrade quality | HIGH | Build eval harness, benchmark before shipping |
| Context enrichment leaks secrets | CRITICAL | Secret detection, `.plan-council-ignore`, review mode |
| Plugin supply chain risks | MEDIUM | Sandbox execution, first-party only initially |
