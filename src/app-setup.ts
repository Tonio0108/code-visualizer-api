import { ValidationPipe, INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  const config = new DocumentBuilder()
    .setTitle('VCR Explorer API')
    .setDescription("API d'analyse et de visualisation d'architecture de dépôts GitHub")
    .setVersion('1.0')
    .addTag('analyzer', 'Endpoints liés à l\'analyse de dépôts')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
