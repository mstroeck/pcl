export const DEPTH_PROMPTS = {
  'high-level': `Focus on high-level architecture and strategic decisions:
- Identify major components and their interactions
- Focus on architectural patterns and technology choices
- Define system boundaries and interfaces
- Keep implementation details minimal
- Steps should be at the component/module level
- Prioritize strategic decisions over tactical ones`,

  'detailed': `Provide a balanced plan with task-level breakdown:
- Break down into concrete tasks and milestones
- Include both architecture and implementation considerations
- Identify key integration points
- Balance strategic and tactical decisions
- Steps should be actionable work items
- Include testing and deployment considerations`,

  'implementation': `Focus on code-level implementation details:
- Break down into specific code changes and file modifications
- Include detailed implementation steps
- Specify APIs, schemas, and data structures
- Include unit testing and integration testing steps
- Consider edge cases and error handling
- Steps should be at the function/class/file level
- Provide specific technical recommendations`,
};

export type DepthLevel = keyof typeof DEPTH_PROMPTS;

export function getDepthPrompt(depth: DepthLevel): string {
  return DEPTH_PROMPTS[depth];
}
