import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';
import bodyParser from 'body-parser';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Serve static files from the "public" directory
    app.use('/public', express.static(path.join(__dirname, '..', 'public')));
    app.use(express.json({ limit: '100mb' }));
    app.use(express.urlencoded({ limit: '100mb', extended: true }));
    // Enable CORS (if needed for frontend requests)
    app.enableCors();

    await app.listen(3000);
    
}   
bootstrap();
