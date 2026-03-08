import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@shared': path.resolve(__dirname, '../shared')
        }
    },
    esbuild: {
        // Crucial for Colyseus classes to retain their names for schema matching
        keepNames: true,
    },
    plugins: [
        {
            name: 'rewrite-public-assets',
            configureServer(server) {
                // Middleware: rewrite /public/assets/* to /assets/* before Vite handles it
                server.middlewares.use((req, _res, next) => {
                    if (req.url && req.url.startsWith('/public/')) {
                        req.url = req.url.replace('/public/', '/');
                    }
                    next();
                });
            }
        }
    ]
});
