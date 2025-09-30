# 🌐 Connect Your Hosted Site to Local Server

This guide shows you how to connect your GitHub Pages hosted site to your local server.

## 🚀 Quick Setup (Recommended)

### Option 1: Using ngrok (Easiest)

1. **Download ngrok**: Go to https://ngrok.com/download
2. **Extract and run**: Extract the zip file to a folder
3. **Start your local server**: 
   ```bash
   npm run dev
   ```
4. **Open new terminal and run ngrok**:
   ```bash
   ./ngrok http 5000
   ```
5. **Copy the HTTPS URL**: ngrok will show something like `https://abc123.ngrok.io`
6. **Update your hosted site**: Update `.env.production` with the ngrok URL
7. **Redeploy**: Run `npm run deploy` from your main project folder

### Option 2: Using localtunnel

1. **Install localtunnel**:
   ```bash
   npm install -g localtunnel
   ```
2. **Start your local server**:
   ```bash
   npm run dev
   ```
3. **Create tunnel**:
   ```bash
   lt --port 5000 --subdomain qbot-api
   ```
4. **Use the provided URL**: Something like `https://qbot-api.loca.lt`

## 🔧 Current Server Configuration

Your server is already configured to accept requests from:
- ✅ `https://crownvibe300.github.io` (your GitHub Pages site)
- ✅ `http://localhost:5173` (local development)
- ✅ CORS enabled with proper headers

## 📝 Steps to Connect

1. **Start Local Server**:
   ```bash
   cd server
   npm run dev
   ```

2. **Create Public Tunnel** (choose one):
   - **ngrok**: `ngrok http 5000`
   - **localtunnel**: `lt --port 5000`

3. **Update Production Config**:
   ```bash
   # Edit .env.production
   VITE_API_URL=https://your-tunnel-url.ngrok.io/api
   ```

4. **Redeploy Frontend**:
   ```bash
   npm run deploy
   ```

5. **Test**: Visit https://crownvibe300.github.io/Q-bot/

## 🎯 What This Enables

- ✅ **Live Authentication**: Login/register from hosted site
- ✅ **Real Database**: Actual user data storage
- ✅ **Full API Access**: All backend features work
- ✅ **Testing**: Test your app as users would see it

## ⚠️ Important Notes

- **Tunnel URLs change**: Free ngrok URLs change each restart
- **Keep server running**: Your local server must stay on
- **Security**: Only for development/testing, not production
- **Performance**: Slight delay due to tunneling

## 🚀 For Production

For a permanent solution, deploy your backend to:
- **Railway**: https://railway.app
- **Render**: https://render.com
- **Vercel**: https://vercel.com
- **Heroku**: https://heroku.com

Then update `.env.production` with your deployed backend URL.

## 🔍 Troubleshooting

**CORS Errors**: Make sure your tunnel URL is added to CORS origins
**Connection Failed**: Check if local server is running on port 5000
**Mixed Content**: Ensure you're using HTTPS tunnel URL, not HTTP
