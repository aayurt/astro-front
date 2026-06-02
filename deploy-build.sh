#!/bin/bash
set -e

SERVER="root@217.154.58.85"
REMOTE_PATH="/var/www/astro-front"
LOCAL_PATH="/Users/aayurtshrestha/Projects/self/astro/astro-front"

echo "🚀 Starting build..."
cd $LOCAL_PATH
pnpm run build

echo "📦 Syncing build to server..."
rsync -avz --delete \
  $LOCAL_PATH/dist/ \
  $SERVER:$REMOTE_PATH/

echo "✅ Done"
# ssh $SERVER "bash -c '
#   source ~/.nvm/nvm.sh
#   cd $REMOTE_PATH
#   pm2 restart ecosystem.config.cjs
#   pm2 save
#   echo \"🎉 Deploy complete!\"
# '"