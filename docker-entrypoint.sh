#!/bin/sh
set -e

# Bootstrap the database schema using the build-time SQL + the bundled pg client.
# Keeps the Prisma CLI (and its large dependency tree) out of the runtime image.
echo "Applying database schema..."
node ./scripts/apply-schema.mjs

echo "Starting server..."
exec "$@"
