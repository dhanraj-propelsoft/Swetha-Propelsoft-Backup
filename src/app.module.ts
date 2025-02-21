import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatGateway } from './chat/chat-gateway';

import { TimerModule } from './timer/timer.module';
import { TimerController } from './timer/timer.controller';

@Module({
  imports: [TimerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
