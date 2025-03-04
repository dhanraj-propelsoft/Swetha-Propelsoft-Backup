// import { Body, Controller, Get, Post } from '@nestjs/common';
// import path from 'path';
// import * as crypto from 'crypto';
// import * as fs from 'fs';
// import { Observable, interval, map, take, tap } from 'rxjs';

// @Controller()
// export class AppController {

//    @Post('decryptedFilePath')
//       getDecryptData(@Body() data):any {
//       const { userId, fileName, encryptedData, iv, authTag ,secretKey} = data;
//       console.log('hi');
      
//       if (!userId || !fileName || !encryptedData || !iv || !authTag) {
//           return { error: 'Missing required fields' };
//       }
  
//       // const user = this.users[userId];
//       // if (!user || !user.dhKeys?.sharedSecret) {
//       //     return { error: 'Decryption error: Shared secret not established' };
//       // }
  
//       const sharedSecret = secretKey; // Get shared secret for this user
  
//       try {
//           // Decrypt image data
//           const decipher = crypto.createDecipheriv(
//               'aes-256-gcm',
//               Buffer.from(sharedSecret, 'hex'),
//               Buffer.from(iv, 'hex')
//           );
//           decipher.setAuthTag(Buffer.from(authTag, 'hex'));
//           const decryptedBuffer = Buffer.concat([
//               decipher.update(Buffer.from(encryptedData, 'hex')),
//               decipher.final(),
//           ]);
  
//           console.log("decipher", decipher);
          
//           // Define decrypted file path
//           const decryptedFolder = path.join(__dirname, '..', 'public', 'decryptedFiles');
//           if (!fs.existsSync(decryptedFolder)) {
//               fs.mkdirSync(decryptedFolder, { recursive: true });
//           }
  
//           const decryptedFilePath = path.join(decryptedFolder, fileName);
  
//           // Save decrypted image
//           fs.writeFileSync(decryptedFilePath, decryptedBuffer);
  
//           // Return the public URL of the decrypted file
//           return {
//               message: 'File decrypted successfully',
//               fileUrl: `http://192.168.0.202:3000/public/decryptedFiles/${fileName}`,
//           };
//       } catch (error) {
//           console.error('Decryption error:', error);
//           return { error: 'Failed to decrypt the file' };
//       }
//   }
// }
 

import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';

@Controller()
export class AppController {
    @Post('decryptedFilePath')
    getDecryptData(@Body() data: { 
        userId: string, 
        fileName: string, 
        encryptedData: string, 
        iv: string, 
        authTag: string, 
        secretKey: string 
    }): any {
        console.log(' Received Decryption Request:', data.fileName);

        if (!data.userId || !data.fileName || !data.encryptedData || !data.iv || !data.authTag || !data.secretKey) {
            return { error: 'Missing required fields' };
        }

        try {
            const sharedSecret = data.secretKey; // The shared secret used for decryption

            const decipher = crypto.createDecipheriv(
                'aes-256-gcm',
                Buffer.from(sharedSecret, 'hex'),
                Buffer.from(data.iv, 'hex')
            );
            decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));

            const decryptedBuffer = Buffer.concat([
                decipher.update(Buffer.from(data.encryptedData, 'hex')),
                decipher.final(),
            ]);

            console.log(' File successfully decrypted.');

            //  Define decrypted file path
            const decryptedFolder = path.join(__dirname, '..', 'public', 'decryptedFiles');
            if (!fs.existsSync(decryptedFolder)) {
                fs.mkdirSync(decryptedFolder, { recursive: true });
            }

            const decryptedFilePath = path.join(decryptedFolder, data.fileName);

            //  Save decrypted file
            fs.writeFileSync(decryptedFilePath, decryptedBuffer);

            //  Return the public URL of the decrypted file
            return {
                message: ' File decrypted successfully!',
                fileUrl: `http://192.168.0.202:3000/public/decryptedFiles/${data.fileName}`,
            };
        } catch (error) {
            console.error(' Decryption error:', error);
            return { error: 'Failed to decrypt the file' };
        }
    }
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: path.join(__dirname, '..', 'public', 'uploads'),
            filename: (req, file, cb) => {
                cb(null, `${Date.now()}-${file.originalname}`);
            }
        })
    }))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            return { success: false, message: 'No file uploaded' };
        }

        return {
            success: true,
            message: 'File uploaded successfully',
            filePath: `/public/uploads/${file.filename}`,
        };
    }
}
