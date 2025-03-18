import { Body, Controller, Post, UploadedFile } from '@nestjs/common';
import { CreateUserDto } from './app.dto';
import * as crypto from 'crypto';
import { Multer } from 'multer';
import { Express } from 'express';
import * as argon2 from 'argon2';
// import { AppService } from './app.service';
import { UseInterceptors } from '@nestjs/common';
import { EncryptionInterceptor } from './app.interceptor';
import { DecryptionInterceptor } from './decrypt.interceptor';
import { EncryptInterceptor } from './encrypt.interceptor';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { EncryptFileInterceptor } from './encryptFile.interceptor';
@Controller()
export class AppController {
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
    console.log("fixed key", this.FIXED_KEY, "and iv",iv);
    
    if (iv.length !== 16) {
      throw new Error('ENCRYPTION_IV must be exactly 16 bytes long');
    }
    this.IV = Buffer.from(iv, 'utf8');
  }
  // Fixed IV (Less secure but ensures same encryption output for the same input)


  private storedData: {
    encryptedData: Record<string, string>;
  }[] = [];
  // private storedData: any[] = [];
  

  @Post('getEncryptFileData')
  @UseInterceptors(
    FileInterceptor('userFile', {
      storage: diskStorage({
        destination: './uploads', // Folder to store files
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
    EncryptFileInterceptor, // Encrypts userId, userMsg, and file path
  )
  getEncryptFileData(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { userId: string; userMsg: string },
  ) {
    console.log('Received Data:', { body, file });

    return {
      message: 'File received and data encrypted successfully',
    };
  }



  @Post('getEncryptedData')
  getEncryptedData(@Body() userData: CreateUserDto): any {
    const cipher = crypto.createCipheriv('aes-256-cbc', this.FIXED_KEY, this.IV);
    let encrypted = cipher.update(JSON.stringify(userData), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encryptedData: encrypted,
    };
  }
  @UseInterceptors(EncryptionInterceptor)
  @Post('getDecryptedData')
  getDecryptedData(@Body() encryptedDataDto: { encryptedData: string }): any {
    try {
      const { encryptedData } = encryptedDataDto;

      // Create decipher instance
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.FIXED_KEY, this.IV);

      // Decrypt the data
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      console.log("decrypted", decrypted);

      // Parse the decrypted JSON string back into an object
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error.message);
      return { error: 'Decryption failed. Invalid data or key.' };
    }
  }

  @UseInterceptors(DecryptionInterceptor)
@Post('getStoredData')
getStoredData(@Body() body: any): any {
  console.log('Received Data in Controller:', body);

  // Wrap the received data inside `encryptedData`
  const formattedData = {
    encryptedData: body, // Store it as an object with `encryptedData`
  };

  this.storedData.push(formattedData); // Push the structured data
  console.log("Stored Data (after fixing structure):", JSON.stringify(this.storedData, null, 2));

  return {
    message: 'Data received successfully',
    data: formattedData,
  };
}

@Post("getDataByEmail")
getDataByEmail(@Body() body: { encryptedEmail: string }) {
  const { encryptedEmail } = body;
  console.log("Stored Data Before Search:", JSON.stringify(this.storedData, null, 2));
  console.log("Searching for Encrypted Email:", encryptedEmail);

  const foundData = this.storedData.find((data) => data.encryptedData.userEmail === encryptedEmail);

  if (!foundData) {
    console.log("No matching user found.");
    return { error: "No matching user found." };
  }

  console.log("User Found (Encrypted):", JSON.stringify(foundData, null, 2));

  // Decrypt only userEmail and userContact
  const decryptField = (encryptedValue: string): string => {
    try {
      const decipher = crypto.createDecipheriv("aes-256-cbc", this.FIXED_KEY, this.IV);
      let decrypted = decipher.update(encryptedValue, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (error) {
      console.error(`Error decrypting value:`, error.message);
      return "Decryption Error";
    }
  };

  // **Ensure the structure matches the original input format exactly**
  const decryptedObject = {
    userName: foundData.encryptedData.userName, // Already decrypted
    userId: foundData.encryptedData.userId, // Already decrypted
    userContact: Number( decryptField(foundData.encryptedData.userContact)),
    userEmail: decryptField(foundData.encryptedData.userEmail),
    userCity: foundData.encryptedData.userCity, // Already decrypted
  };

  const cipher = crypto.createCipheriv('aes-256-cbc', this.FIXED_KEY, this.IV);
  let encrypted = cipher.update(JSON.stringify(decryptedObject), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    encryptedData: encrypted,
  };
}

  @Post('getDataSET')
  @UseInterceptors(DecryptionInterceptor)
  getDataSET(@Body() decryptedData: any) {
    console.log('Received Decrypted Data:', decryptedData);

    // You can now process the decrypted data as needed
    return {
      message: 'Data received successfully',
      data: decryptedData,
    };
  }

  @UseInterceptors(EncryptInterceptor)
  @Post('getEncryptText')
  getEncryptText(@Body() body: any) {
    console.log("body", body);

    return body; // This data is passed to the interceptor for encryption
  }

  @Post('key-stretch')
  async keyStretch(@Body() body: { password: string }) {
      const { password } = body;
      
      // Generate a 16-byte random salt
      const salt = crypto.randomBytes(16).toString('hex');

      // Apply Argon2id for key stretching
      const stretchedKey = await argon2.hash(password, {
          type: argon2.argon2id,
          salt: Buffer.from(salt, 'hex'),
          memoryCost: 2 ** 16,   // 64MB memory usage
          timeCost: 3,           // Iterations
          parallelism: 1,        // Threads
          hashLength: 12         // Output key length
      });

      return { salt, stretchedKey };
  }

  /*
  private storedHash: string | null = null;
  private storedSalt: string | null = null;
  private storedHashSalt: string | null = null;
  

  @Post('register')
    async register(@Body() body: { password: string }) {
        const { password } = body;
        
        // Generate a 16-byte random salt
        const salt = crypto.randomBytes(16).toString('hex');

        // Apply Argon2id for key stretching
        const hashedPassword = await argon2.hash(password, {
            type: argon2.argon2id,
            salt: Buffer.from(salt, 'hex'),
            memoryCost: 2 ** 16,   // 64MB memory usage
            timeCost: 3,           // 3 iterations
            parallelism: 1,        // Single-threaded
            hashLength: 32         // Output key length
        });

        // Store values (Replace with database storage in real apps)
        this.storedHash = hashedPassword;
        this.storedSalt = salt;
        this.storedHashSalt=salt+hashedPassword;
        return { message: `User registered successfully!, ${salt+hashedPassword}` };
    }

    @Post('login')
    async login(@Body() body: { password: string }) {
        if (!this.storedHash || !this.storedSalt) {
            return { message: 'No registered user found. Please register first!' };
        }
        const salt=this.storedHashSalt?.slice(0,17);
        console.log(salt);
        const hashedPassword=this.storedHashSalt?.substring(17,)
        
        // Verify if the input password matches the stored hash
        const isMatch = await argon2.verify(hashedPassword?hashedPassword:"null",body.password);

        return { isMatch, message: isMatch ? 'Login successful!' : 'Invalid password!' };
    }
        */

    private storedHashSalt: string | null = null;

    @Post('register')
    async register(@Body() body: { password: string }) {
        const { password } = body;
        
        // Generate a 16-byte random salt
        const salt = crypto.randomBytes(16).toString('hex'); // 32-char hex string

        // Apply Argon2id for key stretching
        const hashedPassword = await argon2.hash(password, {
            type: argon2.argon2id,
            salt: Buffer.from(salt, 'hex'), // Use the generated salt
            memoryCost: 2 ** 16,  // 64MB memory usage
            timeCost: 3,          // 3 iterations
            parallelism: 1,       // Single-threaded
            hashLength: 32        // Output key length
        });

        // Store hash first, then salt
        this.storedHashSalt = hashedPassword + salt;

        return { message: `User registered successfully!`, storedHashSalt: this.storedHashSalt };
    }

    @Post('login')
    async login(@Body() body: { password: string }) {
        if (!this.storedHashSalt) {
            return { message: 'No registered user found. Please register first!' };
        }

        // Extract the hashed password (first) and salt (last 32 characters)
        const hashedPassword = this.storedHashSalt.slice(0, -32); // Extract stored hash
        const salt = this.storedHashSalt.slice(-32); // Extract salt (last 32 characters)

        // Manually rehash the input password with the extracted salt
        const computedHash = await argon2.hash(body.password, {
            type: argon2.argon2id,
            salt: Buffer.from(salt, 'hex'), // Use extracted salt
            memoryCost: 2 ** 16,  // 64MB memory usage
            timeCost: 3,          // 3 iterations
            parallelism: 1,       // Single-threaded
            hashLength: 32        // Output key length
        });

        // Compare computed hash with stored hash
        const isMatch = computedHash === hashedPassword;

        return { isMatch, message: isMatch ? 'Login successful!' : 'Invalid password!' };
    }

  }
