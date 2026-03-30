import { ConsensusPlan, ConsensusStep, ConsensusDecision, ConsensusRisk } from '../consensus/types.js';

/**
 * Generate a self-contained HTML report with collapsible sections
 */
export function formatHTML(plan: ConsensusPlan, verbose: boolean = false): string {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plan Council Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 2rem;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
    }
    .header h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    .content {
      padding: 2rem;
    }
    .section {
      margin-bottom: 2rem;
    }
    .section-title {
      font-size: 1.5rem;
      color: #667eea;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #667eea;
    }
    .summary {
      font-size: 1.1rem;
      line-height: 1.8;
      color: #555;
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 4px;
    }
    .card {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      transition: box-shadow 0.2s;
    }
    .card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .card-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: #333;
      flex: 1;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 500;
      margin-left: 0.5rem;
    }
    .confidence {
      background: #e3f2fd;
      color: #1565c0;
    }
    .effort {
      background: #fff3e0;
      color: #e65100;
    }
    .risk {
      background: #fce4ec;
      color: #c2185b;
    }
    .category {
      background: #f3e5f5;
      color: #6a1b9a;
    }
    .description {
      color: #666;
      margin: 0.5rem 0;
      line-height: 1.6;
    }
    .meta {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1rem;
      font-size: 0.9rem;
    }
    .meta-item {
      display: flex;
      align-items: center;
      color: #666;
    }
    .meta-label {
      font-weight: 600;
      margin-right: 0.5rem;
    }
    .dependencies {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
    }
    .dependency-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .dependency-tag {
      background: #e8eaf6;
      color: #3f51b5;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.85rem;
    }
    .collapsible {
      cursor: pointer;
      user-select: none;
    }
    .collapsible::before {
      content: '▼ ';
      display: inline-block;
      transition: transform 0.2s;
    }
    .collapsible.collapsed::before {
      transform: rotate(-90deg);
    }
    .collapsible-content {
      max-height: 1000px;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }
    .collapsible-content.collapsed {
      max-height: 0;
    }
    .variations {
      margin-top: 1rem;
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 4px;
    }
    .variation {
      margin-bottom: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e0e0e0;
    }
    .variation:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    .variation-model {
      font-weight: 600;
      color: #667eea;
      margin-bottom: 0.25rem;
    }
    .alternatives {
      margin-top: 0.75rem;
    }
    .alternative {
      padding: 0.5rem;
      background: #f5f5f5;
      border-left: 3px solid #667eea;
      margin-bottom: 0.5rem;
    }
    .severity-critical {
      background: #ffebee;
      border-color: #c62828;
    }
    .severity-high {
      background: #fff3e0;
      border-color: #ef6c00;
    }
    .severity-medium {
      background: #fff9c4;
      border-color: #f9a825;
    }
    .severity-low {
      background: #e8f5e9;
      border-color: #2e7d32;
    }
    .footer {
      background: #f9f9f9;
      padding: 1.5rem 2rem;
      text-align: center;
      color: #666;
      font-size: 0.9rem;
      border-top: 1px solid #e0e0e0;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
      }
      .card:hover {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Plan Council Report</h1>
      <p>Multi-model consensus plan with ${plan.modelPlans.length} models</p>
    </div>
    <div class="content">
      ${renderSummary(plan)}
      ${renderSteps(plan.steps, verbose)}
      ${renderDecisions(plan.decisions, verbose)}
      ${renderRisks(plan.risks)}
      ${plan.disagreements.length > 0 ? renderDisagreements(plan) : ''}
      ${verbose ? renderModelPlans(plan) : ''}
    </div>
    <div class="footer">
      Generated by Plan Council • ${new Date().toLocaleString()}
    </div>
  </div>
  <script>
    document.querySelectorAll('.collapsible').forEach(el => {
      el.addEventListener('click', () => {
        el.classList.toggle('collapsed');
        const content = el.nextElementSibling;
        if (content && content.classList.contains('collapsible-content')) {
          content.classList.toggle('collapsed');
        }
      });
    });
  </script>
</body>
</html>`;

  return html;
}

function renderSummary(plan: ConsensusPlan): string {
  return `
    <div class="section">
      <h2 class="section-title">Summary</h2>
      <div class="summary">${escapeHtml(plan.summary)}</div>
    </div>
  `;
}

function renderSteps(steps: ConsensusStep[], verbose: boolean): string {
  if (steps.length === 0) return '';

  const stepsHtml = steps
    .map(
      (step) => `
    <div class="card">
      <div class="card-header">
        <div class="card-title">${escapeHtml(step.title)}</div>
        <div>
          <span class="badge confidence">${Math.round(step.confidence * 100)}%</span>
          <span class="badge effort">${step.effort}</span>
          <span class="badge risk">${step.risk}</span>
          <span class="badge category">${step.category}</span>
        </div>
      </div>
      <div class="description">${escapeHtml(step.description)}</div>
      <div class="meta">
        <div class="meta-item">
          <span class="meta-label">Proposed by:</span>
          ${step.proposedBy.map((p) => escapeHtml(p)).join(', ')}
        </div>
      </div>
      ${
        step.dependencies.length > 0
          ? `
        <div class="dependencies">
          <div class="meta-label">Dependencies:</div>
          <div class="dependency-list">
            ${step.dependencies.map((dep) => `<span class="dependency-tag">${escapeHtml(dep)}</span>`).join('')}
          </div>
        </div>
      `
          : ''
      }
      ${
        verbose && step.variations.length > 0
          ? `
        <div class="variations">
          <div class="meta-label">Model Variations:</div>
          ${step.variations
            .map(
              (v) => `
            <div class="variation">
              <div class="variation-model">${v.modelName}</div>
              <div>${escapeHtml(v.description)}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `
          : ''
      }
    </div>
  `
    )
    .join('');

  return `
    <div class="section">
      <h2 class="section-title collapsible">Steps (${steps.length})</h2>
      <div class="collapsible-content">
        ${stepsHtml}
      </div>
    </div>
  `;
}

function renderDecisions(decisions: ConsensusDecision[], verbose: boolean): string {
  if (decisions.length === 0) return '';

  const decisionsHtml = decisions
    .map(
      (decision) => `
    <div class="card">
      <div class="card-header">
        <div class="card-title">${escapeHtml(decision.question)}</div>
        <span class="badge confidence">${Math.round(decision.confidence * 100)}%</span>
      </div>
      <div class="description">
        <strong>Recommendation:</strong> ${escapeHtml(decision.recommendation)}
      </div>
      <div class="description">
        <strong>Reasoning:</strong> ${escapeHtml(decision.reasoning)}
      </div>
      ${
        decision.alternatives.length > 0
          ? `
        <div class="alternatives">
          <div class="meta-label">Alternatives:</div>
          ${decision.alternatives.map((alt) => `<div class="alternative">${escapeHtml(alt)}</div>`).join('')}
        </div>
      `
          : ''
      }
      <div class="meta">
        <div class="meta-item">
          <span class="meta-label">Proposed by:</span>
          ${decision.proposedBy.map((p) => escapeHtml(p)).join(', ')}
        </div>
      </div>
    </div>
  `
    )
    .join('');

  return `
    <div class="section">
      <h2 class="section-title collapsible">Key Decisions (${decisions.length})</h2>
      <div class="collapsible-content">
        ${decisionsHtml}
      </div>
    </div>
  `;
}

function renderRisks(risks: ConsensusRisk[]): string {
  if (risks.length === 0) return '';

  const risksHtml = risks
    .map(
      (risk) => `
    <div class="card severity-${risk.severity}">
      <div class="card-header">
        <div class="card-title">${escapeHtml(risk.description)}</div>
        <div>
          <span class="badge confidence">${Math.round(risk.confidence * 100)}%</span>
          <span class="badge risk">${risk.severity}</span>
        </div>
      </div>
      <div class="description">
        <strong>Mitigation:</strong> ${escapeHtml(risk.mitigation)}
      </div>
      <div class="meta">
        <div class="meta-item">
          <span class="meta-label">Identified by:</span>
          ${risk.proposedBy.map((p) => escapeHtml(p)).join(', ')}
        </div>
      </div>
    </div>
  `
    )
    .join('');

  return `
    <div class="section">
      <h2 class="section-title collapsible">Risks (${risks.length})</h2>
      <div class="collapsible-content">
        ${risksHtml}
      </div>
    </div>
  `;
}

function renderDisagreements(plan: ConsensusPlan): string {
  const disagreementsHtml = plan.disagreements
    .map(
      (disagreement) => `
    <div class="card">
      <div class="card-title">${escapeHtml(disagreement.topic)}</div>
      <div class="description">${escapeHtml(disagreement.description)}</div>
      <div class="variations">
        ${disagreement.positions
          .map(
            (pos) => `
          <div class="variation">
            <div class="variation-model">${pos.modelName}</div>
            <div>${escapeHtml(pos.stance)}</div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `
    )
    .join('');

  return `
    <div class="section">
      <h2 class="section-title collapsible">Disagreements (${plan.disagreements.length})</h2>
      <div class="collapsible-content">
        ${disagreementsHtml}
      </div>
    </div>
  `;
}

function renderModelPlans(plan: ConsensusPlan): string {
  const plansHtml = plan.modelPlans
    .map(
      (modelPlan) => `
    <div class="card">
      <div class="card-title">${escapeHtml(modelPlan.modelName)}</div>
      <div class="description">${escapeHtml(modelPlan.summary)}</div>
      <div class="meta">
        <div class="meta-item">
          <span class="meta-label">Steps:</span> ${modelPlan.steps.length}
        </div>
        <div class="meta-item">
          <span class="meta-label">Decisions:</span> ${modelPlan.decisions.length}
        </div>
        <div class="meta-item">
          <span class="meta-label">Risks:</span> ${modelPlan.risks.length}
        </div>
      </div>
    </div>
  `
    )
    .join('');

  return `
    <div class="section">
      <h2 class="section-title collapsible collapsed">Model Plans (${plan.modelPlans.length})</h2>
      <div class="collapsible-content collapsed">
        ${plansHtml}
      </div>
    </div>
  `;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] ?? m);
}
