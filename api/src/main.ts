import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
 
  app.enableCors({
    origin: true, // permitir solicitações de todas as origens
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: false,
  })


  app.enableShutdownHooks()
  await app.listen(7000);
}
bootstrap();
