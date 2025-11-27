#!/bin/bash

# ============================================
# CLEAN ANGULAR v21 SETUP - MEME FORUM
# ============================================

echo "🚀 Starting Angular Frontend Setup..."

# Navigate to your project root (CHANGE THIS PATH)
PROJECT_ROOT="C:\Users\SunilKumarPradhan\Desktop\Seddit"
cd "$PROJECT_ROOT" || exit

# Optional: Backup and remove existing frontend
# mv frontend frontend_backup_$(date +%Y%m%d_%H%M%S)

# Create new Angular 21 project
echo "📦 Creating Angular project..."
npx @angular/cli@21 new frontend \
  --routing=true \
  --style=css \
  --skip-git=true \
  --package-manager=npm \
  --standalone=true

cd frontend || exit

# ============================================
# CORE MODULE
# ============================================
echo "🔧 Creating Core module..."

# Guards (functional)
ng generate guard core/guards/auth --functional --skip-tests
ng generate guard core/guards/role --functional --skip-tests
ng generate guard core/guards/admin --functional --skip-tests

# Interceptors (functional)
ng generate interceptor core/interceptors/jwt --functional --skip-tests
ng generate interceptor core/interceptors/error --functional --skip-tests

# Models (interfaces)
ng generate interface core/models/user --type=model
ng generate interface core/models/post --type=model
ng generate interface core/models/comment --type=model
ng generate interface core/models/notification --type=model

# Core Services
ng generate service core/services/auth --skip-tests
ng generate service core/services/websocket --skip-tests
ng generate service core/services/notification --skip-tests
ng generate service core/services/theme --skip-tests

# ============================================
# FEATURES - AUTH
# ============================================
echo "🔐 Creating Auth feature..."
ng generate component features/auth/login --skip-tests
ng generate component features/auth/signup --skip-tests

# ============================================
# FEATURES - POSTS
# ============================================
echo "📝 Creating Posts feature..."
ng generate component features/posts/post-list --skip-tests
ng generate component features/posts/post-card --skip-tests
ng generate component features/posts/post-detail --skip-tests
ng generate component features/posts/post-create --skip-tests
ng generate service features/posts/services/post --skip-tests

# ============================================
# FEATURES - COMMENTS
# ============================================
echo "💬 Creating Comments feature..."
ng generate component features/comments/comment-thread --skip-tests
ng generate component features/comments/comment-item --skip-tests
ng generate component features/comments/comment-form --skip-tests
ng generate service features/comments/services/comment --skip-tests

# ============================================
# FEATURES - NOTIFICATIONS
# ============================================
echo "🔔 Creating Notifications feature..."
ng generate component features/notifications/notification-bell --skip-tests
ng generate component features/notifications/notification-list --skip-tests
ng generate component features/notifications/notification-item --skip-tests

# ============================================
# FEATURES - USER
# ============================================
echo "👤 Creating User feature..."
ng generate component features/user/profile --skip-tests
ng generate component features/user/settings --skip-tests
ng generate service features/user/services/user --skip-tests

# ============================================
# PAGES
# ============================================
echo "📄 Creating Pages..."
ng generate component pages/home --skip-tests
ng generate component pages/feed --skip-tests
ng generate component pages/not-found --skip-tests

# ============================================
# SHARED COMPONENTS
# ============================================
echo "🔧 Creating Shared components..."
ng generate component shared/components/header --skip-tests
ng generate component shared/components/sidebar --skip-tests
ng generate component shared/components/loading-spinner --skip-tests
ng generate component shared/components/error-message --skip-tests
ng generate component shared/components/confirm-dialog --skip-tests
ng generate component shared/components/user-avatar --skip-tests
ng generate component shared/components/vote-buttons --skip-tests

# ============================================
# ENVIRONMENT FILES
# ============================================
echo "⚙️ Creating environment files..."

cat > src/environments/environment.ts << 'EOF'
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com',
  wsUrl: 'wss://api.yourdomain.com/ws',
  firebaseConfig: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'your-app.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-app.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID'
  }
};
EOF

cat > src/environments/environment.development.ts << 'EOF'
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
  wsUrl: 'ws://localhost:8000/ws',
  firebaseConfig: {
    apiKey: 'YOUR_DEV_API_KEY',
    authDomain: 'your-app-dev.firebaseapp.com',
    projectId: 'your-project-dev',
    storageBucket: 'your-app-dev.appspot.com',
    messagingSenderId: 'YOUR_DEV_SENDER_ID',
    appId: 'YOUR_DEV_APP_ID'
  }
};
EOF

# ============================================
# INSTALL DEPENDENCIES
# ============================================
echo "📦 Installing dependencies..."
npm install rxjs@^7.8.0
npm install socket.io-client@^4.7.0
npm install firebase@^10.7.0
npm install --save-dev @types/socket.io-client

echo ""
echo "✅ ============================================"
echo "✅  FRONTEND SETUP COMPLETE!"
echo "✅ ============================================"
echo ""
echo "📋 Next steps:"
echo "   1. cd frontend"
echo "   2. ng add @angular/material"
echo "      → Choose: Custom theme"
echo "      → Primary: Deep Purple"
echo "      → Accent: Orange"
echo "      → Dark mode: Yes"
echo "   3. ng serve"
echo ""
echo "🎨 Theme setup will be provided next!"
echo ""