import { Injectable } from '@nestjs/common';

@Injectable()
export class TimerService {
  data: number[] = [];
  data1: number[] = [];
  // scheduleData: number[] = []
  getData(type?) {
    if(type){
      return this.data1
    }
    else{
      return this.data
    }
  }

  generateRandomNo(type?) {
    let num = Math.floor(Math.random() * 100);
    if (type) {
      this.data1.push(num);

    } else {
      this.data.push(num);

    }
    console.log("hi");

    return num;

  }

  //  startGeneratingForDuration(duration: number) {
  //    console.log(`Started generating random numbers for ${duration / 1000} seconds...`);

  //    const intervalId = setInterval(() => {
  //      this.generateRandomNo();
  //    }, 5000); // Generate every 5 seconds

  //    setTimeout(() => {
  //      clearInterval(intervalId); // Stop after the given duration
  //      console.log(`Stopped generating after ${duration / 1000} seconds.`);
  //    }, duration);
  //  }

  scheduleNumberGeneration(time: string) {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error('Invalid time format. Please provide time in HH:mm format.');
    }

    const targetTime = new Date();
    targetTime.setHours(hours, minutes, 0, 0); // Set the target time today

    let delay = targetTime.getTime() - now.getTime(); // Calculate the delay in milliseconds

    if (delay < 0) {
      return `The specified time (${time}) has already passed today. Please enter a future time.`;
    }

    console.log(`Random number will be generated at ${time}`);

    setTimeout(() => {
      this.generateRandomNo(1);
      console.log(`Random number generated at ${time}`);
    }, delay);

    return `Random number generation scheduled at ${time}`;
  }
}
