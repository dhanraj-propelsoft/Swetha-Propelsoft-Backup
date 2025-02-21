import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TimerService } from './timer.service';
import { TimerController } from './timer.controller';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [TimerController],
  providers: [TimerService],
})
export class TimerModule {}
