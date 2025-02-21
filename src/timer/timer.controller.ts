import { Body, Controller, Get, Post } from '@nestjs/common';
import { TimerService } from './timer.service';
import { Interval } from '@nestjs/schedule';

@Controller('timer')
export class TimerController {
  constructor(private readonly timerService: TimerService) {}

  @Get('data')
  getData() {
    return this.timerService.getData();
  }

  @Get('scheduleData')
  scheduleData() {
    return this.timerService.getData(1);
  }

  @Get('generate')
  generateRandomNo() {
    return this.timerService.generateRandomNo();
  }

  // Runs automatically every 5 seconds
  @Interval(5000)
  autoGenerateRandomNo() {
    this.timerService.generateRandomNo();
  }
  // @Post('start')
  // startGenerating(@Body('duration') duration: number) {
  //   if (!duration || duration <= 0) {
  //     return { message: 'Please provide a valid duration in milliseconds.' };
  //   }

  //   this.timerService.startGeneratingForDuration(duration);
  //   return { message: `Started generating numbers for ${duration / 1000} seconds.` };
  // }
  @Post('schedule')
  scheduleNumberGeneration(@Body('time') time: string) {
    if (!time) {
      return { message: 'Please provide a valid time in HH:mm format.' };
    }

    try {
      const result = this.timerService.scheduleNumberGeneration(time);
      return { message: result };
    } catch (error) {
      return { error: error.message };
    }
  }
}
