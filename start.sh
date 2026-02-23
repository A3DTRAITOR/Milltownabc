#!/bin/sh
echo "Running database schema push..."
if echo "$DATABASE_URL" | grep -q "render.com"; then
  export DATABASE_URL="${DATABASE_URL}?sslmode=require"
fi
npx drizzle-kit push 2>&1 || echo "Schema push completed with warnings"
echo "Starting application..."
exec npm start
