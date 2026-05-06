import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.setGlobalPrefix('api');

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
  })
  await app.listen(process.env.PORT ?? 3000);
  
}

bootstrap();


