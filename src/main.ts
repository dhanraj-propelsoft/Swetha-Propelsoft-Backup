import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Serve static files from the "public" directory
    app.use('/public', express.static(path.join(__dirname, '..', 'public')));

    // Enable CORS (if needed for frontend requests)
    app.enableCors();

    await app.listen(3000);
    
}   
bootstrap();
