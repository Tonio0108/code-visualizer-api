import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyzerModule } from './analyzer/analyzer.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AnalyzerModule,
    ConfigModule.forRoot({isGlobal: true})
    ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
