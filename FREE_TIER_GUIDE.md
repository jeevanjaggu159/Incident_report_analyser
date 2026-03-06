# 🚀 Gemini API Free Tier Guide

## Overview
Your Incident Report Analyzer is now optimized for Google Gemini's Free Tier. The free tier has **strict quotas** but with smart caching and rate limiting, you can use it effectively.

## Free Tier Quotas

| Metric | Free Tier Limit |
|--------|-----------------|
| Requests per minute | 15 RPM |
| Requests per day | 1,500 RPD |
| Input tokens per minute | 1M TPM |
| Input tokens per day | 10M TPD |

*Note: Quotas reset daily at midnight UTC*

## ✅ What We've Optimized

### 1. **Smart Caching** (2-hour cache)
- If you analyze the **same incident text**, results are returned from cache instantly
- No API call needed = No quota consumption
- Highly effective for testing or similar incident patterns

### 2. **Request Rate Limiting** (3-second minimum between calls)
- Prevents hitting per-minute quota (15 RPM limit)
- Automatically waits 3 seconds between API requests
- Helps distribute quota across the day

### 3. **Token Optimization**
- **Reduced max output tokens**: 800 → 1000 (was 1000)
- **Lower temperature**: 0.3 → 0.7 (more deterministic, slightly fewer tokens)
- **Smaller context prompts** for more efficiency

### 4. **Automatic Retry Logic**
- 5 automatic retries with exponential backoff (2s → 4s → 8s → 16s → 32s)
- Handles 429 "Quota Exceeded" errors gracefully
- User gets helpful message if quota truly exhausted

---

## 📊 Expected Usage Per Analysis

Assuming an average 500-character incident report:

| Component | Estimated Tokens |
|-----------|------------------|
| System prompt | ~250 tokens |
| User report | ~200 tokens |
| Context (3 similar incidents) | ~300 tokens |
| **Total Input** | **~750 tokens** |
| Output (max) | 800 tokens |
| **Per-Analysis Total** | **~1,550 tokens** |

✅ **You can analyze ~6,450 incidents per day** before hitting the 10M daily token quota!

---

## 🎯 Best Practices for Free Tier

### ✅ DO:
1. **Reuse analyses** - Identical incident reports will be cached
2. **Wait between requests** - Automatic (3s min), but don't spam rapidly
3. **Keep reports focused** - Remove unnecessary details to save tokens
4. **Monitor your usage** - Check logs for cache hits vs. API calls
5. **Spread usage across the day** - Avoid bulk analyses in short time windows

### ❌ DON'T:
1. **Make rapid sequential requests** - The system will rate-limit, but it slows down
2. **Submit very long reports** - Keep reports under 2,000 characters when possible
3. **Expect instant responses** - 3-second delays between requests are normal
4. **Use during peak hours if quota sensitive** - Free tier quota is shared globally

---

## 📋 Configuration Settings

Your optimized free tier settings (in `backend/config.py`):

```python
# Caching
CACHE_ENABLED: True              # Always on
CACHE_TTL_SECONDS: 7200         # 2 hours
MAX_CACHE_SIZE: 100             # Max 100 cached analyses

# Rate Limiting  
MIN_REQUEST_INTERVAL_SECONDS: 3.0   # Wait 3 seconds between calls
ENABLE_RATE_LIMITING: True          # Always enforced

# Token Optimization
LLM_TEMPERATURE: 0.3            # More deterministic
LLM_MAX_TOKENS: 800             # Balance quality vs. tokens

# Retries
FREE_TIER_MAX_RETRIES: 5        # Retry on quota errors
FREE_TIER_INITIAL_RETRY_DELAY: 2   # Start at 2 seconds
```

**You can adjust these in `backend/.env`** if needed with environment variables.

---

## 🔍 Monitoring Your Usage

### Check logs for quota issues:
```bash
tail -f backend/logs/app.log | grep -i "rate\|quota\|cache"
```

### Look for these messages:
- ✅ **"Returning cached analysis"** → Cache hit (no quota used)
- ⏸️ **"Rate limiting: waiting"** → Rate limiter in action (normal)
- ⚠️ **"Rate limit hit (429)"** → Quota exhausted, retrying
- ❌ **"Max retries exceeded"** → Daily quota is fully consumed

---

## 🛠️ Troubleshooting

### Problem: "429 You exceeded your current quota"

**Cause**: Your daily free tier quota is exhausted.

**Solution**:
1. **Wait until tomorrow** - Quota resets daily at midnight UTC
2. **Reduce usage** - Make fewer analyses or keep reports shorter
3. **Upgrade to paid** - Visit https://ai.google.dev for one-time setup cost

### Problem: "Rate limiting: waiting" appears constantly

**Cause**: Normal free tier behavior

**Solution**: This is expected! The system is protecting you from quota exhaustion. Don't fast-track the wait times.

### Problem: Analysis takes longer than expected

**Cause**: 3-second rate limiting is active

**Solution**: Normal for free tier. Premium tier (paid) will be instant.

---

## 💰 When to Upgrade?

Consider upgrading to Gemini API's **paid plan** if:

- ✅ You need **instant responses** (no 3-second delays)
- ✅ You analyze **>10 incidents per day** consistently  
- ✅ You work with **very long reports** (>2,000 chars each)
- ✅ You can't manage around daily quota limits
- ✅ You need **24/7 reliability** without quota concerns

**Cost**: Pay-as-you-go pricing (~$0.075 per 1M input tokens, $0.30 per 1M output tokens)

---

## 📞 Support

For issues:
1. Check logs: `backend/logs/app.log`
2. Review this guide's troubleshooting section
3. Check Google Gemini docs: https://ai.google.dev/docs
4. Consider upgrading if free tier is limiting your workflow

---

**Version**: March 5, 2026  
**Last Updated**: After implementing free tier optimizations  
**Status**: ✅ Ready for production on free tier
