// Single source for the agent's model. Mastra's model router resolves the
// `provider/model` string and auto-detects the provider key (ANTHROPIC_API_KEY).
// Override via LLM_MODEL (e.g. anthropic/claude-opus-4-8 for higher quality).

export const vaultModel = process.env.LLM_MODEL ?? 'anthropic/claude-sonnet-4-6'
