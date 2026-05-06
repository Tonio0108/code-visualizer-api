import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import helmet from 'helmet';

async function configureApp(app: INestApplication) {
  app.use(helmet());
  app.setGlobalPrefix('api', { exclude: ['/'] });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.enableCors({
    origin: ['*'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Credentials,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Access-Control-Origin,User-Agent,Referer,Accept-Encoding,Accept-language,Access-Control-Request-Headers,Cache-Control,Pragma',
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await configureApp(app);
  await app.listen(process.env.PORT ?? 3000);
}

// Support for local development
if (!process.env.VERCEL) {
  bootstrap();
}

// Export for Vercel Serverless Functions
let cachedHandler: any;
export default async (req: any, res: any) => {
  if (!cachedHandler) {
    const app = await NestFactory.create(AppModule);
    await configureApp(app);
    await app.init();
    cachedHandler = app.getHttpAdapter().getInstance();
  }
  return cachedHandler(req, res);
};
