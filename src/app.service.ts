import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppService {
    private publicFolder = path.join(__dirname, '..', 'public');

    // getFolderSize(folderName: string): number {
    //     const folderPath = path.join(this.publicFolder, folderName);

    //     // Check if the folder exists
    //     if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    //         throw new BadRequestException(`Folder '${folderName}' does not exist in the public directory.`);
    //     }

    //     let totalSize = 0;

    //     const files = fs.readdirSync(folderPath);
    //     files.forEach(file => {
    //         const filePath = path.join(folderPath, file);
    //         const stats = fs.statSync(filePath);
    //         if (stats.isFile()) {
    //             totalSize += stats.size;
    //         }
    //     });

    //     return parseFloat((totalSize / 1024).toFixed(2)); // Convert bytes to KB
    // }
}

// ________controller for getting total storage for the specific folder____________
  // @Post('total')
    // getTotalStorage(@Body() data: { folderName: string }): { storageUsedKB: number } {
    //     if (!data.folderName) {
    //         throw new BadRequestException('Folder name is required.');
    //     }

    //     const storageUsedKB = this.appService.getFolderSize(data.folderName);
    //     return { storageUsedKB };
    // }