import { ValidationPipe, INestApplication } from '@nestjs/common';
import helmet from 'helmet';

export async function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
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
