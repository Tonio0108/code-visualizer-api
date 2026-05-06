import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import helmet from 'helmet';

async function configureApp(app: INestApplication) {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: '*',
  });
}

// Support for local development
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await configureApp(app);
  await app.listen(process.env.PORT ?? 3000);
}

if (!process.env.VERCEL) {
  bootstrap();
}

// Export for Vercel Serverless Functions
let cachedApp: any;

export default async (req: any, res: any) => {
  if (!cachedApp) {
    const nestApp = await NestFactory.create(AppModule);
    await configureApp(nestApp);
    await nestApp.init();
    cachedApp = nestApp.getHttpAdapter().getInstance();
  }
  return cachedApp(req, res);
};
