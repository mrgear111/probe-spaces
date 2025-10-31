# Deploying Probe Spaces Server

## Quick Deploy to Railway (Recommended - 5 minutes)

Railway offers free hosting with WebSocket support. Perfect for Probe Spaces.

### Steps:

1. **Push server to GitHub:**
```bash
cd spaces-server
git init
git add .
git commit -m "Initial Probe Spaces server"
git remote add origin https://github.com/YOUR_USERNAME/probe-spaces-server.git
git push -u origin main
```

2. **Deploy on Railway:**
   - Go to [railway.app](https://railway.app)
   - Click "Start a New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `probe-spaces-server` repo
   - Railway auto-detects Node.js and deploys!

3. **Get your URL:**
   - Railway gives you a URL like: `https://probe-spaces-production.up.railway.app`
   - Copy this URL

4. **Update Probe browser:**
   - Open `probe/src/main/spaces.ts`
   - Replace line 11 with your Railway URL:
   ```typescript
   const SERVER_URL = 'https://YOUR-APP.up.railway.app';
   ```

5. **Rebuild Probe:**
```bash
cd /Users/dakshsaini/Desktop/probe
npm run build
```

**Done!** All Probe users now connect to your hosted server.

---

## Alternative: Deploy to Render.com

1. Push to GitHub (same as above)
2. Go to [render.com](https://render.com)
3. Create new "Web Service"
4. Connect GitHub repo
5. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Deploy and copy URL

---

## Cost Estimates:

| Platform | Free Tier | Paid |
|----------|-----------|------|
| Railway | 500 hours/month free | $5/month after |
| Render | 750 hours/month free | $7/month after |
| Fly.io | 3 apps free | $1.94/month after |

**Recommendation:** Start with Railway free tier. Upgrade only when you have many users.

---

## For Production Scale:

When you have 1000+ concurrent users:

1. **Use Redis for session storage** (instead of in-memory Map)
2. **Deploy multiple instances** with load balancing
3. **Use Socket.io adapter** for multi-server support
4. **Add monitoring** (Sentry, Datadog)

But for now, single Railway instance handles 100+ concurrent spaces easily!

---

## Local Development:

To test locally before deploying:

```bash
cd spaces-server
npm install
npm start
# Server runs on http://localhost:3030
```

In Probe browser, set environment variable:
```bash
export SPACES_SERVER_URL=http://localhost:3030
npm start
```
