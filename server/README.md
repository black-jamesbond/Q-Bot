# Q-bot Backend API

A lightweight Node.js/Express backend for the Q-bot application. Authentication is handled entirely by Firebase on the frontend.

## Features

- ✅ **Basic API Server** with Express
- ✅ **Security Middleware** (helmet, rate limiting, CORS)
- ✅ **Health Check Endpoints**
- ✅ **Error Handling** with proper HTTP status codes
- 🔥 **Firebase Authentication** (frontend only)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Optional environment variables:
- `CLIENT_URL` - Frontend URL for CORS (default: http://localhost:5173)
- `PORT` - Server port (default: 5000)

### 3. Start Development Server
```bash
npm run dev
```

Server runs on `http://localhost:5000`

## API Endpoints

### Health Check

#### GET `/api/health`
Server health status
```json
{
  "status": "OK",
  "message": "Q-bot server is running (Firebase Auth Only)",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "authentication": "Firebase Authentication"
}
```

#### GET `/api/status`
API status information
```json
{
  "success": true,
  "message": "Q-bot API is running",
  "version": "1.0.0",
  "authentication": "Firebase only"
}
```

## Authentication

🔥 **Authentication is handled entirely by Firebase on the frontend.**

- No backend authentication required
- No JWT tokens or user sessions on the server
- All user management is done through Firebase Authentication
- User data is stored in Firebase Firestore

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configured for frontend domain
- **Helmet**: Security headers
- **Firebase Authentication**: Secure authentication handled by Firebase

## Development

### Scripts
- `npm run dev` - Start with nodemon (auto-restart)
- `npm start` - Start production server
- `npm run https` - Start HTTPS server for GitHub Pages

### Project Structure
```
server/
├── .env                 # Environment variables
├── .env.example         # Environment template
├── index.js             # Main HTTP server
├── index-https.js       # HTTPS server for GitHub Pages
└── package.json         # Dependencies
```

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

## Next Steps

- [ ] Email verification system
- [ ] Password reset functionality
- [ ] File upload endpoints
- [ ] Chat message storage
- [ ] Admin panel routes
- [ ] API documentation with Swagger
