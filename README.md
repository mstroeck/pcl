# pcl — Plan Council

Multi-model AI planning tool with consensus voting. What [rcl](https://github.com/example/rcl) does for code review, pcl does for planning.

## What is Plan Council?

Plan Council dispatches your planning task to multiple AI models in parallel, each producing an independent plan. The consensus engine then merges, deduplicates, and scores these plans to produce a synthesized output with confidence scores.

**Key Features:**
- 🤖 Multi-model consensus (Anthropic, OpenAI, Google)
- 📊 Confidence scoring based on model agreement
- 🔍 Disagreement analysis to highlight different approaches
- 💰 Cost estimation and budget caps
- 🎯 Multiple planning depths (high-level, detailed, implementation)
- 📝 Multiple output formats (terminal, markdown, JSON)
- 🔗 GitHub integration (fetch issues, post comments)

## Installation

```bash
npm install -g plan-council
```

Or use directly with `npx`:

```bash
npx plan-council plan "Add user authentication"
```

## Quick Start

```bash
# Plan from inline description
pcl plan "Add multi-tenancy to the billing system"

# Plan from GitHub issue
pcl plan owner/repo#42

# Plan from file
pcl plan spec.md

# Estimate cost first
pcl plan "Add caching" --estimate

# Use specific models
pcl plan "Add caching" --models opus,gpt-5.4,gemini-2.5-pro

# Output as markdown
pcl plan "Add caching" --markdown --output plan.md

# Post plan as GitHub comment
pcl plan owner/repo#42 --post --github-token $GITHUB_TOKEN
```

## Configuration

Create a `.plan-councilrc.json` file:

```bash
pcl init
```

Example configuration:

```json
{
  "depth": "detailed",
  "consensusThreshold": 0.5,
  "deduplicationThreshold": 0.7,
  "timeout": 60000,
  "models": [
    {
      "provider": "anthropic",
      "model": "claude-opus-4-6"
    },
    {
      "provider": "openai",
      "model": "gpt-5.4"
    },
    {
      "provider": "google",
      "model": "gemini-2.5-pro"
    }
  ],
  "github": {
    "token": "ghp_..."
  }
}
```

**Model Auto-Detection**: If no models are specified, pcl automatically detects available API keys:
- `ANTHROPIC_API_KEY` → claude-opus-4-6
- `OPENAI_API_KEY` → gpt-5.4
- `GOOGLE_API_KEY` or `GEMINI_API_KEY` → gemini-2.5-pro

## Model Aliases

Use shorthand names instead of full model IDs:

```bash
pcl plan "Add feature" --models opus,gpt-5,gemini
```

Supported aliases:
- **Anthropic**: `opus`, `sonnet`, `haiku`
- **OpenAI**: `gpt-5`, `gpt-4o`, `o1`, `o3`
- **Google**: `gemini`, `gemini-2.5-pro`, `gemini-2.5-flash`

## Planning Depths

Control the level of detail with `--depth`:

- **high-level**: Architecture and strategic decisions
- **detailed** (default): Balanced task-level breakdown
- **implementation**: Code-level implementation details

```bash
pcl plan "Refactor auth system" --depth high-level
pcl plan "Add feature X" --depth implementation
```

## Input Sources

pcl supports multiple input sources:

```bash
# GitHub issue (owner/repo#number)
pcl plan mstroeck/pcl#1

# GitHub URL
pcl plan https://github.com/mstroeck/pcl/issues/1

# Issue number with --repo
pcl plan "#1" --repo mstroeck/pcl

# File
pcl plan requirements.txt

# Inline text
pcl plan "Add dark mode to the settings page"

# Stdin
cat spec.md | pcl plan -
```

## Output Formats

### Terminal (default)
Colorful, categorized output with confidence scores:

```bash
pcl plan "Add feature"
```

### Markdown
Perfect for documentation:

```bash
pcl plan "Add feature" --markdown --output plan.md
```

### JSON
Structured output for programmatic use:

```bash
pcl plan "Add feature" --json --output plan.json
```

## GitHub Integration

Post plans directly to issues:

```bash
# Fetch issue and post plan as comment
pcl plan owner/repo#42 --post --github-token $GITHUB_TOKEN
```

## Cost Management

Estimate costs before running:

```bash
pcl plan "Large feature" --estimate
```

Set a budget cap:

```bash
pcl plan "Large feature" --max-cost 0.50
```

## Plan Structure

Each model produces a structured plan with:

- **Steps**: Actionable tasks with effort, risk, dependencies, and categories
- **Decisions**: Key choices with recommendations and alternatives
- **Risks**: Potential issues with severity and mitigation strategies
- **Suggested Order**: Recommended execution sequence

The consensus engine:
- Groups similar steps/decisions/risks across models
- Calculates confidence scores (higher when more models agree)
- Elevates risk severity when flagged by multiple models
- Identifies disagreements where models propose different approaches

## Examples

### Example 1: Feature Planning

```bash
pcl plan "Add real-time notifications to the dashboard"
```

Output includes:
- Architecture steps (WebSocket setup, message queue)
- Implementation steps (client library, UI components)
- Testing steps (unit tests, integration tests)
- Key decisions (WebSocket vs SSE, which message broker)
- Risks (connection stability, scaling concerns)

### Example 2: GitHub Issue

```bash
pcl plan microsoft/vscode#12345 --verbose
```

Fetches the issue, analyzes it with multiple models, and shows:
- Consensus plan with confidence scores
- Model-specific variations (with `--verbose`)
- Areas where models disagree

### Example 3: Cost-Conscious Planning

```bash
pcl plan "Migrate to microservices" --estimate
# Shows: ~$0.15

pcl plan "Migrate to microservices" --max-cost 0.10
# Error: Estimated cost exceeds budget

pcl plan "Migrate to microservices" --models haiku --max-cost 0.10
# Succeeds with cheaper model
```

## CLI Reference

```
pcl plan <target>           Plan a task/feature/issue
pcl init                    Initialize config

Options:
  --models <models>         Comma-separated models
  --context <text>          Additional project context
  --depth <level>           high-level | detailed | implementation
  --json                    Output as JSON
  --markdown                Output as Markdown
  --output <file>           Write to file
  --post                    Post as GitHub comment
  --github-token <token>    GitHub token
  --estimate                Estimate cost without running
  --max-cost <usd>          Budget cap
  --verbose                 Show all model responses
  --timeout <seconds>       Timeout per model
  --repo <owner/repo>       Repository for issue resolution
```

## Architecture

```
src/
├── index.ts                CLI entry point
├── config/                 Configuration & schema
├── resolver/               Input source resolvers
├── prompts/                System prompts
├── dispatch/               Model adapters
├── consensus/              Deduplication & merging
├── output/                 Formatters
└── cost/                   Cost estimation
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Development mode
npm run dev -- plan "test"
```

## License

MIT

## Credits

Inspired by [rcl (Review Council)](https://github.com/example/rcl).

Built with:
- TypeScript
- commander (CLI)
- zod (validation)
- @anthropic-ai/sdk, openai, @google/generative-ai
- @octokit/rest (GitHub)
- vitest (tests)
- chalk, ora (terminal UI)
