import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import {ServeStaticModule} from '@nestjs/serve-static'
import { join } from 'path';
import { UserModule } from './user/user.module';

@Module({
  imports: [ChatModule,
    ServeStaticModule.forRoot(
      {
        rootPath: join(__dirname, '..', '..', '..', 'dist', 'client'),
      }
    ),
    UserModule
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', '..', '..', 'dist', 'client'),
    // })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
