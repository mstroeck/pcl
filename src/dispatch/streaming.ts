import { ModelConfig } from '../config/schema.js';
import { PlanRequest, PlanResponse } from './adapter.js';
import { estimateCost } from '../cost/estimator.js';
import { dispatchToModels } from './runner.js';

/**
 * Callback function called when a model completes
 */
export type StreamCallback = (response: PlanResponse, timingMs: number) => void;

/**
 * Callback function called to update cost counter
 */
export type CostCallback = (currentCost: number, totalEstimate: number) => void;

/**
 * Options for streaming dispatch
 */
export interface StreamingOptions {
  useCache?: boolean;
  cacheTTL?: number;
  onModelComplete?: StreamCallback;
  onCostUpdate?: CostCallback;
}

/**
 * Dispatch to models with streaming callbacks
 * Wraps the standard dispatchToModels but provides progress updates
 */
export async function dispatchToModelsStreaming(
  models: ModelConfig[],
  request: PlanRequest,
  options: StreamingOptions = {}
): Promise<PlanResponse[]> {
  // Estimate total cost
  const estimate = estimateCost(models, request.systemPrompt + request.userPrompt);
  const totalEstimate = estimate.totalCost;

  // Track completed models
  let completedCount = 0;
  let currentCost = 0;

  // Create wrapped promises with timing and callbacks.
  // Each model is dispatched individually so we can fire per-model callbacks as
  // soon as each one finishes (true streaming progress), while still reusing the
  // full pipeline (cache + retry) from runner.ts.
  const promises = models.map(async (modelConfig, index) => {
    const startTime = Date.now();

    try {
      // Dispatch to single model
      const responses = await dispatchToModels([modelConfig], request, {
        useCache: options.useCache,
        cacheTTL: options.cacheTTL,
      });

      const response = responses[0];
      const timingMs = Date.now() - startTime;

      // Update cost estimate. Fall back to an even split of the total when the
      // model name in the estimate doesn't match exactly (e.g. provider-prefixed).
      completedCount++;
      const modelEstimate = estimate.models.find((m) => m.model === modelConfig.model);
      if (modelEstimate) {
        currentCost += modelEstimate.estimatedCost;
      } else {
        currentCost += totalEstimate / models.length;
      }

      // Call callbacks
      if (options.onModelComplete) {
        options.onModelComplete(response, timingMs);
      }

      if (options.onCostUpdate) {
        options.onCostUpdate(currentCost, totalEstimate);
      }

      return response;
    } catch (error) {
      // Handle error case
      const timingMs = Date.now() - startTime;
      const errorResponse: PlanResponse = {
        content: '',
        model: modelConfig.model,
        error: error instanceof Error ? error.message : String(error),
      };

      completedCount++;

      if (options.onModelComplete) {
        options.onModelComplete(errorResponse, timingMs);
      }

      if (options.onCostUpdate) {
        options.onCostUpdate(currentCost, totalEstimate);
      }

      return errorResponse;
    }
  });

  // Wait for all models to complete
  return Promise.all(promises);
}
