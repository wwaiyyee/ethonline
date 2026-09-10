export type BazanticRecipeConfig = {
  gatewayUrl: string;
  graphServiceUrl: string;
  evidenceServiceUrl: string;
  recipeUrl?: string;
};

/** Configuration returned to a hosted Bazantic Recipe or MCP Gateway adapter. */
export function getBazanticRecipeConfig(): BazanticRecipeConfig {
  return {
    gatewayUrl: process.env.BAZANTIC_GATEWAY_URL ?? "",
    graphServiceUrl: process.env.EDGRAPH_GRAPH_SERVICE_URL ?? "",
    evidenceServiceUrl: process.env.EDGRAPH_EVIDENCE_API_URL ?? "",
    recipeUrl: process.env.BAZANTIC_RECIPE_URL,
  };
}

export const EDGRAPH_RECIPE_NAME = "edgraph-live-coverage-evidence";
