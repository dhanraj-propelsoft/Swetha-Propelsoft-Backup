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
export class EncryptInterceptor implements NestInterceptor {
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
        return next.handle().pipe(
            map((responseData) => {
                if (!responseData || typeof responseData !== 'object') {
                    return responseData; // Return as is if the data is invalid
                }

                console.log('Original Data Before Processing:', responseData);

                try {
                    // Fields to decrypt
                    const fieldsToDecrypt = ['userContact', 'userEmail'];
                    const decryptedData = { ...responseData };

                    fieldsToDecrypt.forEach((field) => {
                        if (responseData[field]) {
                            const decipher = crypto.createDecipheriv(
                                'aes-256-cbc',
                                this.FIXED_KEY,
                                this.IV,
                            );
                            let decryptedValue = decipher.update(responseData[field], 'hex', 'utf8');
                            decryptedValue += decipher.final('utf8');
                            decryptedData[field] = decryptedValue;
                        }
                    });

                    console.log('Decrypted Data:', decryptedData);

                    // Encrypt the entire decrypted object into a single string
                    const dataString = JSON.stringify(decryptedData);
                    const cipher = crypto.createCipheriv(
                        'aes-256-cbc',
                        this.FIXED_KEY,
                        this.IV,
                    );
                    let encryptedData = cipher.update(dataString, 'utf8', 'hex');
                    encryptedData += cipher.final('hex');

                    console.log('Final Encrypted Data:', encryptedData);

                    return { encryptedData };
                } catch (error) {
                    console.error('Processing failed:', error.message);
                    return { error: 'Processing failed' };
                }
            }),
        );
    }
}
