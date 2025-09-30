# AI Conversational Backend

A comprehensive backend solution for AI-powered conversational applications built with FastAPI, MongoDB, and Hugging Face Transformers.

## Features

- 🤖 **Conversational AI**: Powered by Hugging Face Transformers (GPT, BERT)
- 💬 **Real-time Chat**: WebSocket support for instant messaging
- 🔐 **Authentication**: JWT-based user authentication and session management
- 📊 **Database**: MongoDB with Beanie ODM for flexible data storage
- 🚀 **High Performance**: FastAPI with async/await support
- 🐳 **Containerized**: Docker and Docker Compose for easy deployment
- 🔒 **Security**: Rate limiting, input validation, and security headers
- 📝 **API Documentation**: Auto-generated OpenAPI/Swagger documentation

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Web Framework** | FastAPI | High-performance async API framework |
| **AI/ML** | Hugging Face Transformers | State-of-the-art language models |
| **Database** | MongoDB + Beanie ODM | Flexible document storage |
| **Authentication** | JWT + PassLib | Secure user authentication |
| **Real-time** | WebSockets | Live chat functionality |
| **Deployment** | Docker + Docker Compose | Containerized deployment |
| **Reverse Proxy** | Nginx | Load balancing and SSL termination |
| **Caching** | Redis | Session storage and background tasks |

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for local development)
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-backend
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

### 3. Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f ai-backend
```

### 4. Verify Installation

```bash
# Check health
curl http://localhost:8000/health

# View API documentation
open http://localhost:8000/docs
```

## API Endpoints

### Authentication
- `POST /api/v1/register` - Register new user
- `POST /api/v1/login` - User login
- `GET /api/v1/me` - Get current user info
- `PUT /api/v1/me` - Update user profile

### Chat
- `POST /api/v1/chat` - Send message and get AI response
- `GET /api/v1/conversations` - List user conversations
- `GET /api/v1/conversations/{id}` - Get conversation details
- `POST /api/v1/conversations` - Create new conversation
- `DELETE /api/v1/conversations/{id}` - Delete conversation

### WebSocket
- `ws://localhost:8000/ws/chat?token=<jwt_token>` - Real-time chat
- `ws://localhost:8000/ws/notifications?token=<jwt_token>` - Notifications

## Development Setup

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start MongoDB and Redis (using Docker)
docker-compose up -d mongodb redis

# Run the application
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `DATABASE_NAME` | Database name | `ai_conversations` |
| `SECRET_KEY` | JWT secret key | `your-secret-key-change-in-production` |
| `DEFAULT_MODEL` | Hugging Face model name | `microsoft/DialoGPT-medium` |
| `MAX_TOKENS` | Maximum tokens per response | `512` |
| `TEMPERATURE` | AI model temperature | `0.7` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |

### Model Configuration

The application supports various Hugging Face models:

- **DialoGPT**: `microsoft/DialoGPT-medium`, `microsoft/DialoGPT-large`
- **GPT-2**: `gpt2`, `gpt2-medium`, `gpt2-large`
- **BERT**: `bert-base-uncased`, `bert-large-uncased`

## Deployment

### Production Deployment

1. **Update Environment Variables**:
   ```bash
   # Set production values in .env
   SECRET_KEY=your-secure-production-key
   DEBUG=false
   MONGODB_URL=mongodb://username:password@your-mongodb-host:27017/ai_conversations
   ```

2. **SSL Configuration**:
   ```bash
   # Place SSL certificates in nginx/ssl/
   cp your-cert.pem nginx/ssl/cert.pem
   cp your-key.pem nginx/ssl/key.pem
   ```

3. **Deploy**:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

### Scaling

For high-traffic deployments:

1. **Horizontal Scaling**: Run multiple backend instances
2. **Load Balancing**: Use Nginx or cloud load balancers
3. **Database Scaling**: MongoDB replica sets or sharding
4. **Caching**: Redis cluster for session storage

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Sanitizes user inputs
- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Configurable cross-origin policies
- **Security Headers**: XSS, CSRF, and clickjacking protection
- **Password Hashing**: Bcrypt for secure password storage

## Monitoring and Logging

- **Structured Logging**: JSON-formatted logs with structlog
- **Health Checks**: Built-in health monitoring endpoints
- **Metrics**: Request/response metrics and performance tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation at `/docs`
- Review the API examples in the `examples/` directory
