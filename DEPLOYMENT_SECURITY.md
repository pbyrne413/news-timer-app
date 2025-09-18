# Secure Deployment Guide

This guide will help you deploy your timer app to Vercel with all security enhancements enabled.

## Prerequisites

1. Vercel CLI installed (`npm i -g vercel`)
2. Vercel account
3. Turso account (for production database)

## Step 1: Environment Variables Setup

### For Local Development
```bash
# Copy the example file
cp env.example .env.local

# Edit .env.local with your local settings
```

### For Production (Vercel Dashboard)
Set these environment variables in your Vercel project dashboard:

#### Required Variables:
```bash
NODE_ENV=production
SESSION_SECRET=your-32-character-random-secret-here
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
CORS_ORIGINS=https://your-domain.vercel.app,https://your-custom-domain.com
```

#### Optional Security Variables:
```bash
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW=60000
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=300000
REQUEST_SIZE_LIMIT=1mb
```

## Step 2: Generate Secure Session Secret

```bash
# Generate a secure 32-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3: Set Up Turso Database (Production)

1. Install Turso CLI: `curl -sSfL https://get.tur.so/install.sh | bash`
2. Login: `turso auth login`
3. Create database: `turso db create timer-app-prod`
4. Get URL: `turso db show timer-app-prod --url`
5. Create auth token: `turso db tokens create timer-app-prod`

## Step 4: Deploy to Vercel

```bash
# Login to Vercel (if not already)
vercel login

# Deploy
vercel --prod

# Or link to existing project
vercel link
vercel --prod
```

## Step 5: Configure Vercel Environment Variables

After deployment, set environment variables in Vercel dashboard:

1. Go to your project in Vercel dashboard
2. Navigate to Settings > Environment Variables
3. Add all the variables from Step 1

## Step 6: Test Security Features

### Test Authentication
```bash
# Get development auth token (only works in development)
curl https://your-app.vercel.app/api/dev-auth

# Test protected reset endpoint
curl -X POST https://your-app.vercel.app/api/reset \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Rate Limiting
```bash
# Should be blocked after 100 requests
for i in {1..105}; do curl https://your-app.vercel.app/api/sources; done
```

### Test CORS
```bash
# Should work from allowed origins
curl -H "Origin: https://your-domain.com" https://your-app.vercel.app/api/sources

# Should be blocked from unauthorized origins (in production)
curl -H "Origin: https://malicious-site.com" https://your-app.vercel.app/api/sources
```

### Test Input Sanitization
```bash
# Should sanitize dangerous input
curl -X POST https://your-app.vercel.app/api/sources \
  -H "Content-Type: application/json" \
  -d '{"name": "<script>alert(\"xss\")</script>Test"}'
```

## Security Verification Checklist

- [ ] Environment variables set in Vercel
- [ ] SESSION_SECRET is 32+ characters
- [ ] CORS_ORIGINS doesn't include wildcards in production
- [ ] Turso database configured
- [ ] Authentication working for reset endpoint
- [ ] Rate limiting active
- [ ] Security headers present
- [ ] Error responses don't leak information
- [ ] Input sanitization working

## Monitoring

### Check Security Headers
```bash
curl -I https://your-app.vercel.app
```

Should include:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy: ...
- Strict-Transport-Security: ... (in production)

### Monitor Logs
Check Vercel function logs for:
- Authentication failures
- Rate limit violations
- Configuration warnings
- Security events

## Troubleshooting

### Common Issues:

1. **CORS errors**: Check CORS_ORIGINS environment variable
2. **Database connection**: Verify TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
3. **Authentication failures**: Ensure SESSION_SECRET is set
4. **Rate limiting too strict**: Adjust RATE_LIMIT_MAX_REQUESTS

### Debug Mode:
Set `NODE_ENV=development` temporarily to get detailed error messages.

## Production Security Checklist

- [ ] NODE_ENV=production
- [ ] SESSION_SECRET set and secure
- [ ] CORS_ORIGINS configured (no wildcards)
- [ ] Turso database in production
- [ ] Rate limiting configured
- [ ] Security headers active
- [ ] Error handling sanitized
- [ ] Authentication required for sensitive operations
- [ ] Input validation and sanitization active
- [ ] Monitoring and logging configured
