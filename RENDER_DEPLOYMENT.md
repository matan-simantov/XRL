# Render Deployment Guide

## Overview
This project consists of two services:
1. **Frontend**: React + Vite static site
2. **Backend**: Node.js Express server

## Deployment Steps

### Option 1: Using render.yaml (Recommended)
1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. In Render dashboard, go to "New" → "Blueprint"
3. Connect your repository
4. Render will automatically detect `render.yaml` and create the services

### Option 2: Manual Deployment

#### Frontend (Static Site)
1. In Render dashboard, go to "New" → "Static Site"
2. Connect your repository
3. Configure:
   - **Name**: `xrl-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment**: Static Site

#### Backend (Web Service)
1. In Render dashboard, go to "New" → "Web Service"
2. Connect your repository
3. Configure:
   - **Name**: `xrl-backend`
   - **Root Directory**: `backend` ⚠️ **IMPORTANT: Must set this!**
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Port**: Auto-detect (or set to 10000)

**Note:** If using `render.yaml`, make sure `rootDir: backend` is set for the backend service.

### Environment Variables

#### Frontend
No environment variables required for basic setup.

#### Backend
- `PORT`: Will be automatically set by Render (defaults to 10000 in code)
- `NODE_ENV`: Set to `production` in Render dashboard

### Important Notes

1. **SPA Routing**: The `public/_redirects` file ensures React Router works correctly by redirecting all routes to `index.html`

2. **Backend CORS**: The backend is configured to allow CORS. If you need to restrict it to your frontend domain, update `backend/server.js`

3. **Build Process**:
   - Frontend: Builds to `dist/` directory
   - Backend: Simple Node.js service, no build needed

4. **File Structure**:
   ```
   /backend         # Backend service
   /src             # Frontend source
   /public          # Static assets (including _redirects)
   render.yaml      # Auto-deployment config
   ```

### Post-Deployment

1. Update any hardcoded URLs in the frontend code to use your Render backend URL
2. Test the deployment:
   - Frontend should load at your Render static site URL
   - Backend should respond at `https://xrl-backend.onrender.com/` with "XRL backend is live"

### Troubleshooting

- **404 errors on routes**: Ensure `_redirects` file is in `public/` directory
- **CORS errors**: Check backend CORS configuration in `backend/server.js`
- **Build failures**: Check Node.js version (Render uses Node 18+ by default)

