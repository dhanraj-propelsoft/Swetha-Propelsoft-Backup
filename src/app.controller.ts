import { Controller, Get } from '@nestjs/common';
import { Observable, interval, map, take, tap } from 'rxjs';

@Controller('storage')
export class AppController {
  @Get('data')
  getData(): Observable<string> {
    return interval(2000).pipe(
      take(5), // Stops after 5 times
      tap((count) => console.log(`Welcome !!! (${count + 1}/5)`)), // Log to console
      map((count) => `Welcome !!! (${count + 1}/5)`) // Send response to client
    );
  }
}
 