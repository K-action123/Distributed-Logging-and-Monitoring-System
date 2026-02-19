#!/bin/sh
# Wait for DB to be ready
echo "Waiting for database to be ready..."
until npx prisma db push --skip-generate; do
  echo "Database is not ready - waiting..."
  sleep 2
done

echo "Database is ready! Starting Auth-MS..."
npx prisma generate
npm run start
