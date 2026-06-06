# Gemini 3.5 Flash Migration

This document describes the migration from OpenRouter to Google Gemini API for AI-powered message generation and lead scoring.

## Changes Made

### 1. Configuration (`config.js`)

- Added flexible AI provider system with support for both Gemini and OpenRouter
- New structure: `config.aiProvider.active` returns the currently selected provider
- Default provider: `gemini`
- Gemini configuration:
  - Base URL: `https://generativelanguage.googleapis.com/v1beta/openai`
  - Default model: `gemini-3.5-flash`
  - Uses OpenAI-compatible API endpoint

### 2. Environment Variables (`.env`, `.env.example`)

- **New required variable:** `GEMINI_API_KEY`
- **New optional variable:** `GEMINI_MODEL` (defaults to `gemini-3.5-flash`)
- **New optional variable:** `AI_PROVIDER` (choose between `gemini` or `openrouter`)
- OpenRouter variables kept for backward compatibility

### 3. AI Scorer (`modules/aiScorer.js`)

- Updated to use `config.aiProvider.active` instead of hardcoded OpenRouter
- Dynamic error messages showing which provider is being used
- Maintains same retry logic and JSON parsing

### 4. Template Engine (`modules/templateEngine.js`)

- Updated to use `config.aiProvider.active`
- Improved logging to show both model and provider
- Same message generation logic with better error handling

### 5. Main Entry Point (`index.js`)

- Updated startup warnings to show which AI provider is configured
- Dynamic warning messages based on active provider

### 6. Documentation

- **README.md:** Updated to reflect Gemini as primary AI provider
- Badge changed from OpenRouter to Gemini
- Configuration section updated with Gemini variables first
- All references to OpenRouter marked as legacy support

### 7. Testing (`test-gemini.js`)

- Comprehensive test script that validates:
  1. Basic API connection
  2. Message generation with realistic contact
  3. Lead scoring with conversation context
- Run with: `node test-gemini.js`

## Why Gemini 3.5 Flash?

1. **Performance:** Gemini 3.5 Flash is optimized for speed and quality
2. **Cost-effective:** Generous free tier for testing and small-scale usage
3. **Better output:** Produces more natural, contextual messages
4. **Official support:** Direct integration with Google AI services

## Migration Steps for Users

1. Get a Gemini API key: <https://ai.google.dev>
2. Update `.env` file:

   ```env
   GEMINI_API_KEY=your_key_here
   GEMINI_MODEL=gemini-3.5-flash
   ```

3. Test the integration: `node test-gemini.js`
4. Run the bot: `npm start`

## Backward Compatibility

OpenRouter is still supported! To use OpenRouter instead:

1. Set `AI_PROVIDER=openrouter` in `.env`
2. Provide `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`
3. The bot will automatically use OpenRouter

## Test Results

All tests passing ✓

```
✓ Basic API connection
✓ Message generation (produces contextual Hinglish messages)
✓ Lead scoring (HOT/WARM/COLD classification)
```

## Notes

- The Gemini API uses OpenAI-compatible endpoints, making migration seamless
- No changes to business logic or state management
- All existing features (retry logic, error handling, rate limiting) maintained
- Both providers use the same `chat/completions` endpoint format
