const express = require('express');
const https = require('https');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { getCerts } = require('https-localhost');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.HTTPS_PORT || 5001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration - Allow GitHub Pages
app.use(cors({
  origin: [
    'https://crownvibe300.github.io',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Q-bot HTTPS server is running (Firebase Auth Only)',
    timestamp: new Date().toISOString(),
    cors: 'enabled for GitHub Pages',
    authentication: 'Firebase Authentication'
  });
});

// Simple API endpoint for testing
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Q-bot HTTPS API is running',
    version: '1.0.0',
    authentication: 'Firebase only'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start HTTPS server
async function startServer() {
  try {
    const certs = await getCerts();
    
    const server = https.createServer(certs, app);
    
    server.listen(PORT, () => {
      console.log(`🚀 Q-bot HTTPS server running on https://localhost:${PORT}`);
      console.log(`🌐 CORS enabled for GitHub Pages`);
      console.log(`🔒 SSL certificates generated automatically`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down gracefully...');
      await database.close();
      server.close(() => {
        console.log('HTTPS server closed');
        process.exit(0);
      });
    });

    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      await database.close();
      server.close(() => {
        console.log('HTTPS server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start HTTPS server:', error);
    process.exit(1);
  }
}

startServer();
