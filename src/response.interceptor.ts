/* code with dto message  */
import {Injectable,NestInterceptor,ExecutionContext,CallHandler,BadRequestException,HttpException} from '@nestjs/common';
import { Observable, map, catchError, throwError } from 'rxjs';
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
    console.log('Inside Interceptor...');
    return next.handle().pipe(
      map((data) => {
        const dataContent = this.extractData(data);
        const dataContentKey = Object.keys(dataContent).toString();
        const data_value = data['status'] ? dataContentKey.length === 1 ? dataContent[`${dataContentKey}`] : dataContent : (data['error'] && data['error']['errorMessage']) ? data['error']['errorMessage'] : 'No data found';
        const data_key = data['error'] ? "error" : "data";
        if (data) {
          throw new HttpException(
            {
              status: data['status'],
              statusCode: data['statusCode'],
              ...(data['status'] && { message: data['message'] }),
              [data_key]: data_value,
            },
            data['statusCode'],
          );
        }
      }),
      catchError((err) => {
        console.log('Caught Error:', err);
        if (err instanceof BadRequestException) {
          const response = err.getResponse();
          console.log('BadRequestException Response:', response);
          if (typeof response === 'object' && 'errors' in response) {
            const errorMessages = response['errors'];
            console.log('DTO Validation Errors:', errorMessages);
            return throwError(() =>
              new HttpException(
                {
                  status: false,
                  statusCode: 400,
                  message: 'Validation Failed',
                  error: errorMessages, // Show DTO errors here
                },
                400,
              ),
            );
          }
        }
        return throwError(() => err);
      }),
    );
  }
  private extractData(data: any): any {
    const excludedKeys = ['status', 'message', 'error', 'statusCode'];
    const keys = Object.keys(data).filter(
      (key) => !excludedKeys.includes(key),
    );
    return keys.length === 1 ? data[keys[0]] : data;
  }
}
