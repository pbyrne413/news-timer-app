# 🚀 Vercel Environment Variables Setup

## 📋 **Required Environment Variables**

Copy these exact values to your Vercel project dashboard:

### **1. Go to Vercel Dashboard**
1. Visit: https://vercel.com/dashboard
2. Select your project: `news-timer`
3. Go to **Settings** → **Environment Variables**

### **2. Add These Variables**

#### **Application Environment**
```
NODE_ENV = production
PORT = 3000
```

#### **Database Configuration**
```
TURSO_DATABASE_URL = libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN = your-turso-auth-token-here
```

#### **Security Configuration**
```
SESSION_SECRET = fb3af61996216adbef1e6cebde7ed82c3b56874499268c2d29fa79f5823183d3
CORS_ORIGINS = https://news-timer-d93hkvreo-pbyrne413s-projects.vercel.app
```

#### **Rate Limiting**
```
RATE_LIMIT_MAX_REQUESTS = 100
RATE_LIMIT_WINDOW = 60000
```

#### **Authentication Security**
```
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION = 300000
```

#### **Business Rules**
```
MIN_ALLOCATION = 60
MAX_ALLOCATION = 3600
MIN_TIME_LIMIT = 60
MAX_TIME_LIMIT = 7200
DEFAULT_ALLOCATION = 300
DEFAULT_TIME_LIMIT = 1800
```

#### **Database Performance**
```
DB_CONNECTION_TIMEOUT = 30000
DB_MAX_RETRIES = 3
```

#### **Request Limits**
```
REQUEST_SIZE_LIMIT = 1mb
MAX_REQUEST_SIZE = 1mb
```

## 🔧 **Quick Setup Commands**

### **Option 1: Vercel CLI (Recommended)**
```bash
# Set environment variables via CLI
vercel env add NODE_ENV production
vercel env add SESSION_SECRET fb3af61996216adbef1e6cebde7ed82c3b56874499268c2d29fa79f5823183d3
vercel env add CORS_ORIGINS https://news-timer-d93hkvreo-pbyrne413s-projects.vercel.app
vercel env add RATE_LIMIT_MAX_REQUESTS 100
vercel env add RATE_LIMIT_WINDOW 60000
vercel env add MAX_LOGIN_ATTEMPTS 5
vercel env add LOCKOUT_DURATION 300000
vercel env add MIN_ALLOCATION 60
vercel env add MAX_ALLOCATION 3600
vercel env add MIN_TIME_LIMIT 60
vercel env add MAX_TIME_LIMIT 7200
vercel env add DEFAULT_ALLOCATION 300
vercel env add DEFAULT_TIME_LIMIT 1800
vercel env add DB_CONNECTION_TIMEOUT 30000
vercel env add DB_MAX_RETRIES 3
vercel env add REQUEST_SIZE_LIMIT 1mb
vercel env add MAX_REQUEST_SIZE 1mb

# Add your Turso database credentials
vercel env add TURSO_DATABASE_URL "libsql://your-database-name.turso.io"
vercel env add TURSO_AUTH_TOKEN "your-turso-auth-token-here"
```

### **Option 2: Dashboard**
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add each variable manually

## 🗄️ **Turso Database Setup**

If you need to set up Turso database:

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login to Turso
turso auth login

# Create database
turso db create news-timer-prod

# Get database URL
turso db show news-timer-prod --url

# Create auth token
turso db tokens create news-timer-prod
```

## ✅ **Verification**

After setting up environment variables:

1. **Redeploy** your application:
   ```bash
   vercel --prod
   ```

2. **Test the endpoints**:
   ```bash
   # Health check
   curl https://news-timer-d93hkvreo-pbyrne413s-projects.vercel.app/api/health
   
   # Enhanced health check
   curl https://news-timer-d93hkvreo-pbyrne413s-projects.vercel.app/api/enhanced-health
   
   # Get development token (for testing)
   curl https://news-timer-d93hkvreo-pbyrne413s-projects.vercel.app/api/dev-auth
   ```

3. **Check security headers**:
   ```bash
   curl -I https://news-timer-d93hkvreo-pbyrne413s-projects.vercel.app
   ```

## 🛡️ **Security Features Active**

With these environment variables set, your application will have:

- ✅ **Authentication** for sensitive operations
- ✅ **Rate limiting** (100 requests/minute)
- ✅ **CORS protection** (only your domain)
- ✅ **Input validation** and sanitization
- ✅ **Security headers** (CSP, HSTS, etc.)
- ✅ **Error handling** without information disclosure
- ✅ **Session security** with proper secrets

## 🚨 **Important Notes**

1. **Replace Turso credentials** with your actual database URL and token
2. **SESSION_SECRET** is already generated and secure
3. **CORS_ORIGINS** is set to your current Vercel domain
4. **All security features** are now properly configured
5. **Rate limiting** is active to prevent abuse

Your application is now **production-ready** with enterprise-grade security! 🎉
