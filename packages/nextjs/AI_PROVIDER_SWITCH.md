# AI Provider Switching Guide

The claims evaluation system supports **both Gemini and Claude APIs**. You can switch between them anytime without code changes.

## Quick Switch

Edit `packages/nextjs/.env`:

```bash
# Use Gemini (default)
AI_PROVIDER=GEMINI
GEMINI_API_KEY=your-gemini-key

# Switch to Claude
AI_PROVIDER=CLAUDE
ANTHROPIC_API_KEY=your-claude-key
```

**That's it!** Restart the dev server and the system will use the new provider.

## Provider Details

### Gemini (Google)
- Model: `gemini-2.0-flash-exp`
- Fast, cost-effective
- Good for high-volume claim processing

### Claude (Anthropic)
- Model: `claude-3-5-sonnet-20241022`
- More analytical reasoning
- Better for complex edge cases

## Both APIs Required?

You can keep both API keys in `.env` and switch the `AI_PROVIDER` variable as needed:

```bash
AI_PROVIDER=GEMINI              # ← Change this line only

GEMINI_API_KEY=AQ.Ab8RN6I...
ANTHROPIC_API_KEY=sk-ant-...   # ← Add your Claude key here
```

## Testing

Run the claim evaluation script to test the active provider:

```bash
yarn workspace @sh/nextjs run tsx scripts/evaluate-claims.ts
```

The console will show:
```
[AI] Using provider: GEMINI
[AI] Querying Gemini 2.0 Flash for claim evaluation...
```

Or:
```
[AI] Using provider: CLAUDE
[AI] Querying Claude for claim evaluation...
```

## No API Key Fallback?

If neither API key is set, the system will **throw an error** (no rule-based fallback). This ensures you're always aware when AI evaluation is unavailable.

To temporarily disable AI evaluation, you'd need to modify the code to skip the evaluation step entirely.
