# AI Backend Makefile

.PHONY: help install dev test clean docker-build docker-up docker-down logs

# Default target
help:
	@echo "Available commands:"
	@echo "  install     - Install dependencies"
	@echo "  dev         - Run development server"
	@echo "  test        - Run tests"
	@echo "  clean       - Clean up cache and temporary files"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-up   - Start services with Docker Compose"
	@echo "  docker-down - Stop Docker Compose services"
	@echo "  logs        - View Docker logs"
	@echo "  format      - Format code with black"
	@echo "  lint        - Run code linting"

# Development setup
install:
	pip install -r requirements.txt

dev:
	python start.py

# Testing
test:
	pytest tests/ -v

test-cov:
	pytest tests/ --cov=app --cov-report=html --cov-report=term

# Code quality
format:
	black app/ tests/ --line-length 88

lint:
	flake8 app/ tests/
	mypy app/

# Docker commands
docker-build:
	docker build -t ai-backend .

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-restart:
	docker-compose restart ai-backend

logs:
	docker-compose logs -f ai-backend

# Database commands
db-init:
	docker-compose exec mongodb mongo ai_conversations /docker-entrypoint-initdb.d/init-mongo.js

db-backup:
	docker-compose exec mongodb mongodump --db ai_conversations --out /data/backup

# Cleanup
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name ".coverage" -delete
	rm -rf htmlcov/
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/

# Production deployment
deploy-prod:
	docker-compose -f docker-compose.yml up -d --build

# Health check
health:
	curl -f http://localhost:8000/health || exit 1
