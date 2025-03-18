import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import * as crypto from 'crypto';
  import { ConfigService } from '@nestjs/config';
  import { map } from 'rxjs/operators';
  
  @Injectable()
  export class EncryptFileInterceptor implements NestInterceptor {
    private FIXED_KEY: Buffer;
    private IV: Buffer;
  
    constructor(private readonly configService: ConfigService) {
      const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
      const iv = this.configService.get<string>('ENCRYPTION_IV', '0000000000000000');
      
      if (!encryptionKey) {
        throw new Error('ENCRYPTION_KEY is not set in the .env file');
      }
      if (iv.length !== 16) {
        throw new Error('ENCRYPTION_IV must be exactly 16 bytes long');
      }
      
      this.FIXED_KEY = crypto.createHash('sha256').update(encryptionKey).digest();
      this.IV = Buffer.from(iv, 'utf8');
    }
    
    private encryptField(value: any): any {
      console.log("value", value);
      
      if (!value) return "null"; // Handle null or undefined values
      
      const cipher = crypto.createCipheriv('aes-256-cbc', this.FIXED_KEY, this.IV);
      
      // 🔹 Convert non-string values to a string before encryption
      const valueString = typeof value === 'string' ? value : JSON.stringify(value);
      
      let encrypted = cipher.update(valueString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      console.log("encrypted", encrypted);
      return encrypted;
    }
    
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const { userId, userMsg } = request.body;
      const file = request.file;
      console.log("file",file);
      
      const encryptedData = {
        encryptedUserId: this.encryptField(userId),
        encryptedUserMsg: this.encryptField(userMsg),
        encryptedFile: file ? this.encryptField(file) : null,
      };
      console.log("encryptedData",encryptedData);
      
      return next.handle().pipe(
        map(() => ({
          message: 'Data encrypted successfully',
          data: encryptedData,
        })),
      );
    }
  }
  
  
    // private encryptField(value: any): any {
    //   console.log("value",value);
      
    //   if (!value) return "null";
    //   const cipher = crypto.createCipheriv('aes-256-cbc', this.FIXED_KEY, this.IV);
    //   let encrypted = cipher.update(value, 'utf8', 'hex');
    //   encrypted += cipher.final('hex');
    //   console.log("encrypted",encrypted);
      
    //   return encrypted;
    // }