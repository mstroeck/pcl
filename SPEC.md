# pcl — Plan Council

Multi-model AI planning tool with consensus voting. What rcl does for code review, pcl does for planning.

## Core Concept

Input: a task, feature, issue, or spec → dispatched to N models in parallel → each model produces an independent plan → consensus engine merges, deduplicates, and scores → synthesized output.

## Input Sources

1. **GitHub issue**: `pcl plan owner/repo#42` — fetches issue title + body + comments
2. **Inline description**: `pcl plan "Add multi-tenancy to the billing system"`
3. **File**: `pcl plan spec.md` or `pcl plan requirements.txt`
4. **Stdin**: `cat spec.md | pcl plan -`
5. **URL**: `pcl plan https://github.com/org/repo/issues/42`

## What Each Model Produces

Each model independently generates a structured plan:

```json
{
  "summary": "One-line summary of the approach",
  "steps": [
    {
      "title": "Step title",
      "description": "What this step involves",
      "effort": "S|M|L|XL",
      "risk": "low|medium|high",
      "dependencies": ["step-id"],
      "category": "architecture|implementation|testing|infrastructure|design|research"
    }
  ],
  "decisions": [
    {
      "question": "What database to use?",
      "recommendation": "PostgreSQL",
      "reasoning": "ACID compliance needed for financial data",
      "alternatives": ["MongoDB", "DynamoDB"]
    }
  ],
  "risks": [
    {
      "description": "Migration could cause downtime",
      "severity": "high",
      "mitigation": "Use blue-green deployment"
    }
  ],
  "estimatedTotalEffort": "M",
  "suggestedOrder": ["step-1", "step-2", "step-3"]
}
```

## Consensus Engine

Same philosophy as rcl but adapted for plans:

1. **Group similar steps** across models by title/description similarity (same dedup approach as rcl)
2. **Elevate confidence** — steps proposed by multiple models get higher confidence scores
3. **Merge decisions** — if models agree on a decision, it's consensus; if they differ, show alternatives
4. **Merge risks** — deduplicate, elevate severity when multiple models flag same risk
5. **Disagreement analysis** — show where models propose fundamentally different approaches
6. **Synthesize order** — combine suggested orderings into a consensus execution plan

## CLI Interface

```
pcl plan <target>           Plan a task/feature/issue
pcl init                    Initialize config
pcl --help                  Help

Options:
  --models <models>         Comma-separated models (defaults: auto-detect SOTA)
  --context <text>          Codebase/project context
  --depth <level>           Planning depth: high-level | detailed | implementation (default: detailed)
  --json                    Output as JSON
  --markdown                Output as Markdown
  --output <file>           Write to file
  --post                    Post as GitHub issue comment
  --github-token <token>    GitHub token
  --estimate                Estimate cost without running
  --max-cost <usd>          Budget cap
  --verbose                 Show all model responses + disagreements
  --timeout <seconds>       Timeout per model
  --repo <owner/repo>       Repository context (for issue resolution)
```

## Architecture (mirrors rcl)

```
src/
├── index.ts                CLI entry point (commander)
├── config/
│   ├── schema.ts           Zod schemas
│   ├── defaults.ts         Default models (auto-detect keys)
│   └── loader.ts           Config loading (cosmiconfig)
├── resolver/
│   ├── index.ts            Route to correct resolver
│   ├── github.ts           Fetch GitHub issue
│   ├── file.ts             Read local file
│   ├── inline.ts           Inline text
│   └── types.ts            PlanInput, ResolverOptions
├── dispatch/
│   ├── adapter.ts          PlanRequest, PlanResponse interfaces
│   ├── runner.ts           Parallel dispatch with retries
│   ├── anthropic.ts        Anthropic adapter
│   ├── openai.ts           OpenAI adapter
│   ├── google.ts           Google adapter
│   ├── openai-compat.ts    OpenAI-compatible adapter
│   └── capabilities.ts     Model capability profiles
├── consensus/
│   ├── index.ts            Main consensus builder
│   ├── parser.ts           Parse model JSON responses
│   ├── deduper.ts          Step/decision/risk deduplication
│   ├── merger.ts           Merge plans into consensus
│   ├── types.ts            Step, Decision, Risk, ConsensusPlan
│   └── disagreements.ts    Disagreement analysis
├── output/
│   ├── terminal.ts         Terminal formatting
│   ├── markdown.ts         Markdown output
│   ├── json.ts             JSON output
│   └── github.ts           Post to GitHub issue
├── prompts/
│   ├── base.ts             Base planning prompt
│   └── depth.ts            Depth-specific prompts (high-level/detailed/implementation)
└── cost/
    └── estimator.ts        Token/cost estimation
```

## Key Differences from rcl

- **No diff/chunking** — plans are typically shorter inputs than code diffs
- **Structured plan output** instead of findings (steps, decisions, risks)
- **Depth levels** — high-level (architecture), detailed (tasks), implementation (code-level)
- **GitHub issue resolver** instead of PR resolver
- **Execution ordering** — consensus on what to do first
- **Decision tracking** — where models agree/disagree on approach choices

## Tech Stack (same as rcl)

- TypeScript, ESM
- commander (CLI)
- zod (validation)
- cosmiconfig (config)
- @anthropic-ai/sdk, openai, @google/generative-ai
- @octokit/rest (GitHub)
- vitest (tests)
- chalk, ora (terminal UI)
