#!/bin/bash

# Build and run backend
docker build -t meme-backend ./backend
docker run -d --name meme-backend \
    -p 8000:8000 \
    --env-file ./backend/.env \
    meme-backend

# Build and run frontend
docker build -t meme-frontend ./frontend
docker run -d --name meme-frontend \
    -p 4200:80 \
    meme-frontend

# Run postgres db
docker run -d --name meme-db \
    -p 5432:5432 \
    -e POSTGRES_USER=meme_user \
    -e POSTGRES_PASSWORD=meme_pass \
    -e POSTGRES_DB=meme_forum \
    -v meme_pg_data:/var/lib/postgresql/data \
    postgres:16-alpine

# Run redis
docker run -d --name meme-redis \
    -p 6379:6379 \
    redis:7-alpine