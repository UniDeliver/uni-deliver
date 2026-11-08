import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/db';

async function bootstrap() {
  try {
    // Connect to database
    await connectDatabase();

    const server = http.createServer(app);

    server.listen(env.PORT, () => {
      console.log(`[Server] UniDeliver API running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      console.log(`[Server] Health check: http://localhost:${env.PORT}/health`);
    });

    const shutdown = async () => {
      console.log('[Server] Shutting down gracefully...');
      server.close(() => {
        console.log('[Server] HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
