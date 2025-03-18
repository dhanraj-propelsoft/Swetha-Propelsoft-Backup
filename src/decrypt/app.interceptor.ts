
import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
  } from '@nestjs/common';
  import * as crypto from 'crypto';
  import { Observable } from 'rxjs';
  import { map } from 'rxjs/operators';
  import { AppController } from './app.controller';
  import { ConfigService } from '@nestjs/config';
  
  @Injectable()
  export class EncryptionInterceptor implements NestInterceptor {
    FIXED_KEY: Buffer;
    IV: Buffer;
    constructor(private readonly configService: ConfigService) {
      const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
      const IV = Buffer.alloc(16, 0); // 16 bytes of zeros (Must be 16 bytes for AES-256-CBC)
      if (!encryptionKey) {
        throw new Error('ENCRYPTION_KEY is not set in the .env file');
      }
      // Fixed Key for All Users (This key should be stored securely in env variables)
      this.FIXED_KEY = crypto.createHash('sha256').update(encryptionKey).digest();
      const iv = this.configService.get<string>('ENCRYPTION_IV', '0000000000000000');
      if (iv.length !== 16) {
        throw new Error('ENCRYPTION_IV must be exactly 16 bytes long');
      }
      this.IV = Buffer.from(iv, 'utf8');
    }
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const { encryptedData } = request.body; // Remove key from here
  
      try {
        // Decrypt the data first using FIXED_KEY
        const decipher = crypto.createDecipheriv(
          'aes-256-cbc',
          this.FIXED_KEY, // Use the fixed key
          this.IV,
        );
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        console.log("dec", decrypted)
        // Parse JSON to extract fields
        const userData = JSON.parse(decrypted);
  
        // Encrypt each field separately and store in an object
        const encryptedObject: Record<string, string> = {};
        Object.entries(userData).forEach(([field, value]) => {
          const cipher = crypto.createCipheriv(
            'aes-256-cbc',
            this.FIXED_KEY, // Use the fixed key
            this.IV,
          );
          let encrypted = cipher.update(String(value), 'utf8', 'hex');
          encrypted += cipher.final('hex');
          encryptedObject[field] = encrypted; // Store as key-value pair
        });
  
        // Modify request body to include structured data
        request.body = {
          encryptedData: encryptedObject, // Store encrypted fields as an object
        };
  
        return next.handle().pipe(
          map(() => ({
            encryptedData: encryptedObject,
          })),
        );
      } catch (error) {
        return next.handle().pipe(
          map(() => ({
            error: 'Failed to process stored data. Invalid encryption or key.',
          })),
        );
      }
    }
  }
  
  
  