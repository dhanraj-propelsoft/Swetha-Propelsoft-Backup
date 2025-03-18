/* Encrypt to Decrypt all data  */

/*
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
  
  @Injectable()
  export class DecryptionInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const { encryptedData } = request.body; // Extract encrypted data
  
      if (!encryptedData) {
        return next.handle();
      }
  
      try {
        // Create a decipher instance
        const decipher = crypto.createDecipheriv(
          'aes-256-cbc',
          AppController.FIXED_KEY,
          AppController.IV,
        );
  
        // Decrypt the data
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
  
        // Parse JSON string back into an object
        const decryptedObject = JSON.parse(decrypted);
        console.log('Decrypted Data:', decryptedObject);
  
        // Modify the request body to store decrypted data
        request.body = decryptedObject;
  
        return next.handle();
      } catch (error) {
        console.error('Decryption failed:', error.message);
        return next.handle().pipe(
          map(() => ({ error: 'Decryption failed. Invalid data or key.' })),
        );
      }
    }
  }
*/

/* Encrypt to Decrypt specific data  */

import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Observable } from 'rxjs';
import { AppController } from './app.controller';
import { map } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DecryptionInterceptor implements NestInterceptor {
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
        const { encryptedData } = request.body; // Extract encrypted data

        if (!encryptedData) {
            return next.handle();
        }

        try {
            // Create a decipher instance
            const decipher = crypto.createDecipheriv(
                'aes-256-cbc',
                this.FIXED_KEY,
                this.IV,
            );

            // Decrypt the data
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            // Parse JSON string back into an object
            const decryptedObject = JSON.parse(decrypted);
            console.log('Decrypted Data:', decryptedObject);

            // Encrypt only userEmail and userContact
            const encryptedFields = ['userEmail', 'userContact', 'userGender','userList'];
            const encryptedObject: Record<string, string> = { ...decryptedObject };

            encryptedFields.forEach((field) => {
                if (decryptedObject[field]) {
                    const valueToEncrypt = String(decryptedObject[field]); // Ensure it's a string
                    const cipher = crypto.createCipheriv(
                        'aes-256-cbc',
                        this.FIXED_KEY,
                        this.IV,
                    );
                    let encryptedValue = cipher.update(valueToEncrypt, 'utf8', 'hex');
                    encryptedValue += cipher.final('hex');
                    encryptedObject[field] = encryptedValue;
                }
            });

            console.log('Processed Data:', encryptedObject);

            // Pass the modified data to the controller
            request.body = encryptedObject;

            return next.handle();
        } catch (error) {
            console.error('Decryption failed:', error.message);
            return next.handle();
        }
    }
}
