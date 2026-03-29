# pcl v0.2 — Implementation TODO

## Phase 1: Foundation (P0)

### 1. Comprehensive Test Suite
- [ ] Unit tests: `src/consensus/deduper.ts` — similarity edge cases, cache eviction, empty strings, grouping
- [ ] Unit tests: `src/consensus/parser.ts` — valid JSON, malformed JSON, size limits, Zod defaults
- [ ] Unit tests: `src/consensus/merger.ts` — threshold filtering, fallback on empty, weighted merge
- [ ] Unit tests: `src/consensus/disagreements.ts` — disagreement detection, edge cases
- [ ] Unit tests: `src/config/loader.ts` — config parsing, model string validation, alias resolution
- [ ] Unit tests: `src/resolver/index.ts` — path traversal, GitHub URL parsing, stdin TTY
- [ ] Unit tests: `src/cost/estimator.ts` — token estimation, multi-byte, cost calculation
- [ ] Integration tests: mock LLM APIs, run full pipeline dispatch→consensus→output
- [ ] Snapshot tests: terminal, markdown, JSON output formatters
- [ ] Target: 80%+ coverage

### 2. Domain Research (Pre-Planning Intelligence)
- [ ] Create `src/research/` directory
- [ ] `src/research/types.ts` — ResearchRequest, ResearchResponse, ResearchProvider interface
- [ ] `src/research/perplexity.ts` — Perplexity Sonar adapter (default: `sonar-deep-research`)
  - Uses OpenAI-compatible API (`https://api.perplexity.ai`)
  - Env: `PERPLEXITY_API_KEY`
  - Returns structured research with citations
- [ ] `src/research/openai-compat.ts` — generic OpenAI-compatible research provider
  - Configurable base URL, model, API key
  - Supports any provider with chat completions endpoint
- [ ] `src/research/index.ts` — router: pick provider from config, synthesize research query from task input
- [ ] Research query synthesis: extract key topics/questions from task description + issue context
- [ ] Token budget management: truncate research output to fit within planning model context
- [ ] Inject research into planning prompt: `<domain-research>...</domain-research>` section
- [ ] Update `src/prompts/base.ts` — instruct planning models to ground plans in provided research
- [ ] Config schema: add `research` section
  ```
  research: {
    enabled: true,          // --no-research to disable
    provider: 'perplexity', // or 'openai-compat', or custom
    model: 'sonar-deep-research',
    maxTokens: 4096,        // budget for research output
    cacheTTL: 3600,         // seconds
    baseUrl?: string,       // for openai-compat
    apiKey?: string,        // override env var
  }
  ```
- [ ] CLI flags: `--research` (default on), `--no-research`, `--research-provider <provider>`, `--research-model <model>`
- [ ] Cache research results (same query hash = cached response)
- [ ] Tests: mock Perplexity API, verify research injection, verify --no-research skips
- [ ] Cost estimation: include research cost in `--estimate` output

### 3. Upgraded Similarity Algorithm
- [ ] `src/consensus/similarity.ts` — new module with pluggable algorithms
- [ ] Implement TF-IDF cosine similarity (no external deps, in-process)
  - Document frequency tracking across all steps in current run
  - IDF weighting for discriminative terms
- [ ] Hybrid mode: Jaccard fast-path (>0.85) → TF-IDF for the rest
- [ ] Config: `consensus.similarity: 'jaccard' | 'tfidf' | 'hybrid'` (default: 'hybrid')
- [ ] Text normalization: lowercase, stemming (simple suffix stripping), stop word removal
- [ ] Update `src/consensus/deduper.ts` to use new similarity module
- [ ] Tests: compare Jaccard vs TF-IDF on known similar/dissimilar step pairs
- [ ] Benchmark: measure grouping quality improvement

### 4. Response Caching
- [ ] `src/cache/index.ts` — cache manager
- [ ] Cache key: SHA-256 of (systemPrompt + userPrompt + model + config hash + research hash)
- [ ] Storage: `~/.plan-council/cache/<hash>.json`
- [ ] Configurable TTL (default 1 hour)
- [ ] `--no-cache` flag to force fresh queries
- [ ] Cache hit/miss indicator in output
- [ ] Cache size management: `pcl cache clear`, max cache size config
- [ ] Tests: cache hit, cache miss, TTL expiry, --no-cache

### 5. Improved Error Handling
- [ ] Structured logging: `--log-level debug|info|warn|error`
- [ ] Per-model timeout config (default 120s)
- [ ] Graceful degradation: if 1/3 models timeout, continue with 2
- [ ] `--dry-run`: validate config, resolve input, estimate cost, exit
- [ ] Better error messages: show exactly which env var to set for missing API keys
- [ ] Rate limit detection: parse 429 headers, show retry-after to user

---

## Phase 2: Quality (P1)

### 6. Weighted Consensus
- [ ] Config: per-model `weight` field (default 1.0, max 3.0)
- [ ] Update merger: weighted confidence = sum(model_weights) / total_weight
- [ ] Borda count for suggested order merging
- [ ] Category-aware weights (optional): `modelWeights.architecture`, `modelWeights.implementation`
- [ ] Show per-model contribution in verbose output
- [ ] Tests: verify weighted scoring, Borda count, weight cap

### 7. Dependency Graph Resolution
- [ ] When merging steps: remap dependency IDs to consensus step IDs
- [ ] Cycle detection in merged dependency graph
- [ ] Missing prerequisite warnings
- [ ] Topological sort for execution order (replaces Borda count when deps available)
- [ ] Tests: dependency remapping, cycle detection, topo sort

### 8. LLM Meta-Synthesis
- [ ] `src/consensus/synthesizer.ts` — synthesis pass module
- [ ] Uses cheapest configured model (or user choice)
- [ ] Prompt: coherence check, gap analysis, summary improvement, dependency validation
- [ ] `--synthesize` flag (opt-in)
- [ ] Show both mechanical consensus and synthesis results
- [ ] Tests: mock synthesis call, verify prompt structure

### 9. Model Registry
- [ ] `src/config/registry.ts` — centralized model metadata
- [ ] Fields: aliases, pricing, capabilities, defaults, provider constraints
- [ ] Replace scattered metadata in defaults.ts, capabilities.ts, estimator.ts
- [ ] Easy model addition: one entry in registry = works everywhere
- [ ] Tests: alias resolution, capability lookup, cost calculation

---

## Phase 3: Ship (P2)

### 10. GitHub Action
- [ ] `action.yml` — composite action definition
- [ ] Triggers: issue.opened, issue.labeled
- [ ] Posts plan as issue comment
- [ ] Cost guardrails: fail if estimated cost > budget
- [ ] Secrets masking in logs
- [ ] Example workflow in README

### 11. Plugin Architecture
- [ ] Define interfaces: ModelAdapter, OutputFormatter, InputResolver, ResearchProvider
- [ ] Plugin discovery: config entries → require() npm packages or local paths
- [ ] First-party: Ollama adapter, Linear export
- [ ] Docs: plugin development guide

### 12. Rich Output Formats
- [ ] Mermaid dependency graph generator
- [ ] HTML report (self-contained, collapsible)
- [ ] Versioned JSON output schema (v1)
- [ ] `--output-format mermaid|html|json-v1`

### 13. Streaming Output
- [ ] Progressive display as models complete
- [ ] Real-time token/cost counter
- [ ] Early consensus preview

### 14. CLI DX
- [ ] `pcl doctor` — validate keys, test connectivity
- [ ] `pcl config show` — resolved config
- [ ] Config profiles (`--profile fast|thorough`)
- [ ] Shell completions
