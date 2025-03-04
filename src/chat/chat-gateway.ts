/* private and group  */

import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException, Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@WebSocketGateway({ cors: true })
export class ChatGateway {


    @WebSocketServer()
    server: Server;

    private users: { [userId: string]: { sockets: string[], dhKeys?: { publicKey: string, privateKey: string, sharedSecret?: string } } } = {};
    private groups: {
        [groupId: string]: {
            members: string[],
            senderKeys: { [senderId: string]: string }
        }
    } = {};

    // private users: Record<string, any> = {}; // Store user sockets

    @SubscribeMessage('sendFile')
    async handleFileUpload(
        @MessageBody() data: { senderId: string; file: Buffer; fileName: string }, 
        @ConnectedSocket() client: Socket
    ) {
        if (!data.file || !data.fileName) {
            client.emit('uploadError', { message: 'Invalid file data' });
            return;
        }

        try {
            // Define upload path
            const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

            // Create unique filename
            const uniqueFileName = `${Date.now()}-${data.fileName}`;
            const filePath = path.join(uploadDir, uniqueFileName);

            // Save the file
            fs.writeFileSync(filePath, Buffer.from(data.file));

            // Send success response back to client
            client.emit('fileUploaded', {
                success: true,
                message: 'File uploaded successfully',
                filePath: `/public/uploads/${uniqueFileName}`,
            });

            console.log(`File ${uniqueFileName} uploaded successfully.`);
        } catch (error) {
            console.error('File upload error:', error);
            client.emit('uploadError', { message: 'File upload failed' });
        }
    }
    // Encrypt using AES-GCM
    private encryptData(data: Buffer, secret: string): { encryptedData: string, iv: string, authTag: string } {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), iv);
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return { encryptedData: encrypted.toString('hex'), iv: iv.toString('hex'), authTag: authTag.toString('hex') };
    }

    // Decrypt using AES-GCM2016
    private decryptData(encryptedData: string, iv: string, authTag: string, secret: string): Buffer {
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        return Buffer.concat([decipher.update(Buffer.from(encryptedData, 'hex')), decipher.final()]);
    }

    @SubscribeMessage('registerUser')
    registerUser(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
        if (!this.users[userId]) {
            this.users[userId] = { sockets: [client.id] };
            const ecdh = crypto.createECDH('secp256k1');
            const publicKey = ecdh.generateKeys('hex');
            const privateKey = ecdh.getPrivateKey('hex');
            this.users[userId].dhKeys = { publicKey, privateKey };
            console.log("current users:", this.users);

        } else {
            this.users[userId].sockets.push(client.id);
        }

        client.emit('publicKey', { userId, publicKey: this.users[userId].dhKeys!.publicKey });
    }

    @SubscribeMessage('createGroup')
    createGroup(@MessageBody() data: { groupId: string, members: string[] }, @ConnectedSocket() client: Socket) {
        if (this.groups[data.groupId]) {
            client.emit('senderKey', { message: 'Group already exists' });
            return;
        }

        this.groups[data.groupId] = {
            members: data.members,
            senderKeys: {}
        };
        console.log(`Group ${data.groupId} created.`);
        console.log(this.groups);

    }

    @SubscribeMessage('sendPublicKey')
    sendPublicKey(@MessageBody() data: { senderId: string, recipientId: string }) {
        const sender = this.users[data.senderId];
        const recipient = this.users[data.recipientId];
        if (!sender || !recipient) return;

        const senderEcdh = crypto.createECDH('secp256k1');
        senderEcdh.setPrivateKey(sender.dhKeys!.privateKey, 'hex');
        sender.dhKeys!.sharedSecret = senderEcdh.computeSecret(recipient.dhKeys!.publicKey, 'hex', 'hex');

        const recipientEcdh = crypto.createECDH('secp256k1');
        recipientEcdh.setPrivateKey(recipient.dhKeys!.privateKey, 'hex');
        recipient.dhKeys!.sharedSecret = recipientEcdh.computeSecret(sender.dhKeys!.publicKey, 'hex', 'hex');
        console.log(` Shared Secret for ${data.senderId}: ${sender.dhKeys!.sharedSecret}`);
        console.log(` Shared Secret for ${data.recipientId}: ${recipient.dhKeys!.sharedSecret}`);
        sender.sockets.forEach(socketId => {
            this.server.to(socketId).emit('receivePublicKey', { userId: data.recipientId, publicKey: recipient.dhKeys!.publicKey });
        });

        recipient.sockets.forEach(socketId => {
            this.server.to(socketId).emit('receivePublicKey', { userId: data.senderId, publicKey: sender.dhKeys!.publicKey });
        });
    }
   @SubscribeMessage('sendMessage')
       handleMessage(@MessageBody() data: { senderId: string, toUserId?: string, groupId?: string, message?: string, filePath?: string }, @ConnectedSocket() client: Socket) {
       const sender = this.users[data.senderId];
       if(data.groupId){
           const group = this.groups[data.groupId];
           if (!group) {
               console.error(`Group ${data.groupId} not found.`);
               return;
           }
   
           if (!group.senderKeys[data.senderId]) {
               group.senderKeys[data.senderId] = crypto.randomBytes(32).toString('hex');
   
               group.members.forEach(userId => {
                   this.users[userId]?.sockets.forEach(socketId => {
                       this.server.to(socketId).emit('senderKey', {
                           groupId: data.groupId,
                           senderId: data.senderId,
                           senderKey: group.senderKeys[data.senderId]
                       });
                   });
               });
               console.log(`Sender Key generated for user ${data.senderId} in group ${data.groupId}`);
           }
   
           const senderKey = group.senderKeys[data.senderId];
           let encryptedMessage: { encryptedData: string, iv: string, authTag: string } | null = null;
           let encryptedFile: { encryptedData: string, iv: string, authTag: string } | null = null;
   
           if (data.message) {
               encryptedMessage = this.encryptData(Buffer.from(data.message), senderKey);
           }
   
           if (data.filePath) {
               try {
                   const fileBuffer = fs.readFileSync(data.filePath);
                   encryptedFile = this.encryptData(fileBuffer, senderKey);
               } catch (error) {
                   console.error(`Error reading file ${data.filePath}:`, error);
                   return;
               }
           }
   
           if (!encryptedMessage && !encryptedFile) {
               console.error('No message or file to send.');
               return;
           }
   
           // **📌 Remove null values dynamically**
           const filteredData = Object.fromEntries(
               Object.entries({
                   groupId: data.groupId,
                   senderId: data.senderId,
                   messageData:{
                       messageIv: encryptedMessage?.iv ?? null,
                       messageAuthTag: encryptedMessage?.authTag ?? null,
                       encryptedMessage: encryptedMessage?.encryptedData ?? null
                   },
                   fileData:{    
                       fileIv: encryptedFile?.iv ?? null,
                       fileAuthTag: encryptedFile?.authTag ?? null,
                       fileName: data.filePath ? data.filePath.split('\\').pop() : null,
                       encryptedFile: encryptedFile?.encryptedData ?? null
                   }
               }).filter(([_, v]) => v !== null) // Remove null values
           );
   
           group.members.forEach(userId => {
               this.users[userId]?.sockets.forEach(socketId => {
                   this.server.to(socketId).emit('receiveMessage', filteredData);
               });
           });
   
           console.log(`Encrypted ${data.filePath ? 'file' : 'message'} sent in group ${data.groupId} by ${data.senderId}`);
       }
       else{ 
   
           if (!sender || !sender.dhKeys?.sharedSecret) {
               client.emit('receiveMessage', { message: 'Encryption error: Shared secret not established' });
               return;
           }
       
           let encryptedMessage, decryptedMessage;
           let fileMetadata;
       
           if (data.message) {
               const encrypted = this.encryptData(Buffer.from(data.message), sender.dhKeys.sharedSecret);
               encryptedMessage = encrypted;
               decryptedMessage = this.decryptData(encrypted.encryptedData, encrypted.iv, encrypted.authTag, sender.dhKeys.sharedSecret).toString();
           }
       
           if (data.filePath) {
               if (!fs.existsSync(data.filePath)) {
                   client.emit('receiveMessage', { message: 'File not found' });
                   return;
               }
       
               // Read image as binary data
               const fileBuffer = fs.readFileSync(data.filePath);
       
               // Encrypt the actual image data
               const { encryptedData, iv, authTag } = this.encryptData(fileBuffer, sender.dhKeys.sharedSecret);
       
               fileMetadata = {
                   fileName: path.basename(data.filePath),
                   encryptedData,  // Now sending encrypted image data instead of file path
                   iv,
                   authTag
               };
           }
       
           const messagePayload = {
               senderId: data.senderId,
               encryptedMessage,
               decryptedMessage,
               fileMetadata,
           };
       
           // Send to sender
           sender.sockets.forEach(socketId => {
               this.server.to(socketId).emit('receiveMessage', messagePayload);
           });
       
           // Send to receiver
           if (data.toUserId) {
               const recipient = this.users[data.toUserId];
               if (!recipient || !recipient.dhKeys?.sharedSecret) return;
       
               let decryptedReceiverMessage;
               if (encryptedMessage) {
                   decryptedReceiverMessage = this.decryptData(encryptedMessage.encryptedData, encryptedMessage.iv, encryptedMessage.authTag, recipient.dhKeys.sharedSecret).toString();
               }
       
               const receiverPayload = {
                   senderId: data.senderId,
                   encryptedMessage,
                   decryptedMessage: decryptedReceiverMessage,
                   fileMetadata, // Send same encrypted image data to receiver
               };
       
               recipient.sockets.forEach(socketId => {
                   this.server.to(socketId).emit('receiveMessage', receiverPayload);
               });
           }
       }
   
       
   }
   

    @SubscribeMessage('leaveGroup')
    leaveGroup(@MessageBody() data: { userId: string, groupId: string }) {
        const group = this.groups[data.groupId];
        if (!group) return;

        group.members = group.members.filter(id => id !== data.userId);
        delete group.senderKeys[data.userId];

        console.log(`User ${data.userId} left group ${data.groupId}`);

        if (group.members.length > 0) {
            group.members.forEach(senderId => {
                const newSenderKey = crypto.randomBytes(32).toString('hex');
                group.senderKeys[senderId] = newSenderKey;
                group.members.forEach(userId => {
                    this.users[userId]?.sockets.forEach(socketId => {
                        this.server.to(socketId).emit('senderKey', {
                            groupId: data.groupId,
                            senderId,
                            senderKey: newSenderKey
                        });
                    });
                });
            });
            console.log(`Sender Keys rotated for group ${data.groupId}`);
        } else {
            delete this.groups[data.groupId];
            console.log(`Group ${data.groupId} deleted.`);
        }
    }
}



