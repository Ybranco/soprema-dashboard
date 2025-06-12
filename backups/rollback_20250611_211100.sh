#!/bin/bash
echo "🔄 ROLLBACK vers la version précédente..."
if [ -f "./backups/server.backup.20250611_211100.js" ]; then
    cp "./backups/server.backup.20250611_211100.js" server.js
    echo "✅ server.js restauré"
fi
if [ -f "./backups/soprema-product-matcher.backup.20250611_211100.js" ]; then
    cp "./backups/soprema-product-matcher.backup.20250611_211100.js" soprema-product-matcher.js
    echo "✅ soprema-product-matcher.js restauré"
fi
echo "🎯 Rollback terminé. Redémarrez le serveur."
