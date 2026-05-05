import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security settings
  app.use(helmet());
  app.enableCors();
  
  // Global configurations
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.init();
  return app;
}

// Check if running in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  bootstrap().then(async (app) => {
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}/api`);
  });
}

// Export the handler for Vercel
export default async (req: any, res: any) => {
  const app = await bootstrap();
  const instance = app.getHttpAdapter().getInstance();
  return instance(req, res);
};
