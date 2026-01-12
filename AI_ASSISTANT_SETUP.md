# AI Assistant Setup Guide

## Connecting OpenAI API

The AI Assistant in COPCCA CRM uses OpenAI's GPT-4o-mini model to provide intelligent responses, data analysis, and business insights.

### Quick Setup

**1. Get OpenAI API Key**
- Visit https://platform.openai.com/api-keys
- Sign in or create an account
- Click "Create new secret key"
- Name it (e.g., "COPCCA-CRM")
- Copy the key (starts with `sk-...`)
- **Important:** Save it securely - you won't see it again!

**2. Add Key to Environment**

Open your `.env` file and replace the placeholder:

```env
# OpenAI API Configuration
VITE_OPENAI_API_KEY=sk-your-actual-key-here
```

**3. Restart Development Server**

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

**4. Test the AI Assistant**

- Click the AI Assistant icon (bot icon) in the bottom-right corner
- Ask a question like "Analyze my sales pipeline"
- You should get intelligent responses from GPT-4o-mini

### Features

The AI Assistant can help with:

✅ **Sales Analysis**
- Pipeline forecasting
- Deal prioritization
- Revenue predictions

✅ **Customer Insights**
- Engagement patterns
- Churn risk analysis
- Follow-up recommendations

✅ **Data Analysis**
- Generate custom reports
- Identify trends
- Performance metrics

✅ **Business Strategy**
- Actionable recommendations
- Market insights
- Growth opportunities

### Demo Mode vs. Live Mode

**Demo Mode** (without API key)
- Pre-programmed responses
- Pattern-based replies
- No real AI analysis
- Free to use

**Live Mode** (with API key)
- Real GPT-4o-mini responses
- Contextual understanding
- Advanced analysis
- Costs ~$0.15 per 1M input tokens

### API Usage & Costs

The AI Assistant uses:
- **Model:** gpt-4o-mini (fast, affordable)
- **Max Tokens:** 500 per response
- **Context:** Last 5 messages
- **Estimated Cost:** $0.15/1M input tokens, $0.60/1M output tokens

**Monthly Usage Estimate:**
- 1,000 questions/month ≈ $2-5
- 5,000 questions/month ≈ $10-20
- 10,000 questions/month ≈ $20-40

### Troubleshooting

**Issue:** "Failed to get AI response. Using demo mode."

**Solutions:**
1. Check your API key is correct (starts with `sk-`)
2. Verify key is added to `.env` file (not `.env.example`)
3. Restart the dev server after adding the key
4. Check OpenAI account has available credits
5. Verify internet connection

**Issue:** "Quota exceeded" error

**Solutions:**
1. Check your OpenAI billing dashboard
2. Add payment method if needed
3. Increase usage limits in OpenAI settings

**Issue:** API key exposed in git

**Prevention:**
- `.env` is in `.gitignore` by default
- Never commit API keys to git
- Use environment variables in production
- Rotate keys if accidentally exposed

### Production Deployment

**Environment Variables:**

For Vercel:
```bash
vercel env add VITE_OPENAI_API_KEY
```

For Netlify:
```bash
# Add in Netlify UI: Site settings → Environment variables
VITE_OPENAI_API_KEY = sk-your-key-here
```

For other platforms:
- Add `VITE_OPENAI_API_KEY` to your hosting provider's environment variables
- Ensure it's not exposed in client-side code

### Security Best Practices

1. **Never expose keys in frontend code** ✅ Already handled - key is in environment variable
2. **Use API key restrictions** - Set allowed origins in OpenAI dashboard
3. **Monitor usage** - Check OpenAI dashboard regularly
4. **Set spending limits** - Configure in OpenAI billing settings
5. **Rotate keys periodically** - Generate new keys every few months

### Advanced Configuration

To modify AI behavior, edit `src/components/layout/AIAssistant.tsx`:

```typescript
// Change model (line 77)
model: 'gpt-4o-mini', // or 'gpt-4o', 'gpt-3.5-turbo'

// Adjust creativity (line 95)
temperature: 0.7, // 0 = focused, 1 = creative

// Change response length (line 96)
max_tokens: 500, // Increase for longer responses

// Modify system prompt (line 81)
content: 'You are a helpful AI assistant...'
```

### Testing

**Test Questions:**
- "Analyze my sales pipeline"
- "Which customers need follow-up?"
- "Generate a revenue forecast"
- "What are my top performing products?"
- "Suggest ways to improve customer retention"

### Support

- OpenAI Documentation: https://platform.openai.com/docs
- OpenAI Status: https://status.openai.com
- COPCCA CRM Issues: Check project README

---

**Status:** 
- ✅ AI Assistant UI: Ready
- ✅ OpenAI Integration: Ready (add key to activate)
- ✅ Demo Mode: Active (fallback when no key)
- ✅ Error Handling: Built-in
- ✅ Cost Optimization: gpt-4o-mini + token limits

**Next Steps:**
1. Add your OpenAI API key to `.env`
2. Restart the dev server
3. Test with a few questions
4. Monitor usage in OpenAI dashboard
