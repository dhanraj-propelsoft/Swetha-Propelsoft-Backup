// import {
//     SubscribeMessage,
//     WebSocketGateway,
//     WebSocketServer,
//     OnGatewayInit,
//     OnGatewayConnection,
//     OnGatewayDisconnect,
//   } from '@nestjs/websockets';
//   import { Logger } from '@nestjs/common';
//   import { Server, Socket } from 'socket.io';



//   @WebSocketGateway({ namespace: 'chat', cors: true })
//   export class ChatGateway
//     implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
//   {
//     @WebSocketServer() server: Server;
//     private logger: Logger = new Logger('ChatGateway');

//     // Handle when WebSocket is initialized
//     afterInit() {
//       this.logger.log('WebSocket Gateway Initialized');
//     }

//     // Handle new client connection
//     handleConnection(client: Socket) {
//       this.logger.log(`Client connected: ${client.id}`);
//     }

//     // Handle client disconnection
//     handleDisconnect(client: Socket) {
//       this.logger.log(`Client disconnected: ${client.id}`);
//     }

//     // Handle joining a room
//     @SubscribeMessage('joinRoom')
//     handleJoinRoom(client: Socket, room: string) {
//       client.join(room);
//       this.logger.log(`Client ${client.id} joined room: ${room}`);
//       client.emit('joinedRoom', room);
//     }

//     // Handle receiving and broadcasting messages
//     @SubscribeMessage('sendMessage')
//     handleMessage(client: Socket, payload: { room: string; message: string }) {
//       this.logger.log(`Message from ${client.id} in room ${payload.room}: ${payload.message}`);
//       this.server.to(payload.room).emit('receiveMessage', {
//         message: payload.message,
//         sender: client.id,
//         timestamp: new Date().toString(),
//       });
//     }
//   }


// import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
// import { Server, Socket } from "socket.io";

// @WebSocketGateway(3002,{})
// export class ChatGateway{
//     @WebSocketServer() server:Server;//communicate many clients

//     handleConnection(client:Socket){
//         console.log('New user connected..',client.id);
//         client.broadcast.emit('user-joined',{message:`New user joined the chat: ${client.id}`,});
//         // this.server.emit('user-joined',{
//         //     message:`User joined the chat:${client.id}`,
//         // })
//     }
//     handleDisconnect(client:Socket){
//         console.log('user disconnected..',client.id);
//         this.server.emit('user-left',{
//             message:`User left the chat:${client.id}`,
//         })
//     }
//     @SubscribeMessage('newMessage')
//     handleNewMessage(@MessageBody() message: string){
//         console.log(message);

//         this.server.emit('reply',message)

//     // handleNewMessage(client:Socket,message:any){
//     // console.log(message);
//     // client.emit('reply','this is a reply');
//     // this.server.emit('reply','broadcasting...')//shows on group
//     }
// }

// socket.emit() -- to send message to single client
// io.emit()    -- to send message to many clients

/* private chat */

/*
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  @WebSocketGateway(3002,{ cors: true })  // Enable CORS if needed
  export class ChatGateway {
    @WebSocketServer()
    server: Server;
    private users = new Map<string, string>(); // Map of socket ID -> user ID
    // Handle user connection
    handleConnection(@ConnectedSocket() client: Socket) {
      console.log(`User connected: ${client.id}`);
    }
    // Handle user disconnection
    handleDisconnect(@ConnectedSocket() client: Socket) {
      console.log(`User disconnected: ${client.id}`);
      this.users.delete(client.id);
    }
    // Register user when they connect
    @SubscribeMessage('registerUser')
    registerUser(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
      this.users.set(client.id, userId);
      console.log(`User ${userId} registered with socket ID: ${client.id}`);
    }
    // Handle sending messages
    @SubscribeMessage('sendMessage')
    handleMessage(
      @MessageBody() data: { senderId: string; receiverId: string; message: string },
      @ConnectedSocket() client: Socket
    ) {
      console.log(`Message from ${data.senderId} to ${data.receiverId}: ${data.message}`);
      // Find the receiver's socket ID
      const receiverSocketId = [...this.users.entries()].find(([_, userId]) => userId === data.receiverId)?.[0];
      console.log("reId", receiverSocketId);
      
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('receiveMessage', {
            Sender:data.senderId,
            message:data.message
        });
        
        
      } else {
        console.log(`User ${data.receiverId} is not online.`);
      }
    }
  }
  
  */

/* group chat */

/*
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(3002, { cors: true })
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    // Store users and rooms
    private users: { [userId: string]: string[] } = {}; // userId -> array of socketIds
    private rooms: { [roomName: string]: string[]  } = {}; // roomName -> array of userIds

    // Handle user connection
    handleConnection(@ConnectedSocket() client: Socket) {
        console.log(`User connected: ${client.id}`);
    }

    // Handle user disconnection
    handleDisconnect(@ConnectedSocket() client: Socket) {
        console.log(`User disconnected: ${client.id}`);

        // Remove socket ID from all users
        for (const userId in this.users) {
            const index = this.users[userId].indexOf(client.id);
            if (index !== -1) {
                this.users[userId].splice(index, 1);
                if (this.users[userId].length === 0) {
                    delete this.users[userId]; // Remove user if no sockets left
                }
                break;
            }
        }

        // Remove user from all rooms they were part of
        for (const room in this.rooms) {
            const index = this.rooms[room].indexOf(client.id);
            if (index !== -1) {
                this.rooms[room].splice(index, 1);
                this.server.to(room).emit('user-left', {
                    room,
                    userId: client.id,
                    message: `User ${client.id} left the room.`,
                });
            }
        }
    }

    // Register user when they connect
    @SubscribeMessage('registerUser')
    registerUser(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
        // Store socket ID under the userId
        if (!this.users[userId]) {
            this.users[userId] = [];
        }

        // Avoid duplicates
        if (!this.users[userId].includes(client.id)) {
            this.users[userId].push(client.id);
        }

        console.log(`User ${userId} registered with socket ID: ${client.id}`);
        console.log('Current Users:', this.users);
    }

    // Join a chat room
    @SubscribeMessage('joinRoom')
    joinRoom(
        @MessageBody() data: { room: string; userId: string },
        @ConnectedSocket() client: Socket
    ) {
        const { room, userId } = data;

        console.log("a", this.users[userId])
        console.log("b", this.users)
        console.log("c", this.users[userId].includes(client.id))
        console.log("c", client.id)
        // Check if the user is registered before joining
        // if (!this.users[userId] || !this.users[userId].includes(client.id)) {
        if (!this.users[userId]) {
            console.log(`User ${userId} is not registered. Please register before joining.`);
            return;
        }

        // Create room if not exists
        if (!this.rooms[room]) {
            this.rooms[room] = [];
        }

        // Add userId to the room if not already present
        if (!this.rooms[room].includes(userId)) {
            this.rooms[room].push(userId);
        }

        // Join the socket to the room in Socket.IO
        client.join(room);

        console.log(`User ${userId} joined room: ${room}`);

        // Display all room members by userId
        console.log(`Current Room Members in ${room}:`, this.rooms[room]);

        this.server.to(room).emit('user-joined', {
            room,
            userId,
            message: `User ${userId} joined the room.`,
        });
    }

    // Handle sending messages
    @SubscribeMessage('sendMessage')
    handleMessage(
        @MessageBody() data: {
            senderId: string;
            message: string;
            room?: string;
        },
        @ConnectedSocket() client: Socket
    ) {
        console.log(
            `Message from ${data.senderId} to ${data.room}: ${data.message}`
        );

        // Check if it's a room message
        if (data.room) {
            console.log('Room:', data.room);
            console.log('Rooms:', this.rooms);

            // Get all userIds in the room
            const roomMembers = this.rooms[data.room];

            if (roomMembers && roomMembers.length > 0) {
                roomMembers.forEach((userId) => {
                    // Get all socket IDs for the user
                    const socketIds = this.users[userId];

                    // Emit message to all sockets for that user
                    socketIds.forEach((socketId) => {
                        this.server.to(socketId).emit('receiveMessage', {
                            senderId: data.senderId,
                            room: data.room,
                            message: data.message,
                        });
                        console.log(`Message sent to User ID: ${userId} in Room: ${data.room}`);
                    });
                });
            } else {
                console.log(`Room ${data.room} does not exist or has no members.`);
            }
        }
    }
}
*/

/* code to upload image */

/*
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';

@WebSocketGateway(3002, { cors: true })
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    // Store users and rooms
    private users: { [userId: string]: string[] } = {}; // userId -> array of socketIds
    private rooms: { [roomName: string]: string[] } = {}; // roomName -> array of userIds

    // Handle user connection
    handleConnection(@ConnectedSocket() client: Socket) {
        console.log(`User connected: ${client.id}`);
    }

    // Handle user disconnection
    handleDisconnect(@ConnectedSocket() client: Socket) {
        console.log(`User disconnected: ${client.id}`);

        // Remove socket ID from all users
        for (const userId in this.users) {
            const index = this.users[userId].indexOf(client.id);
            if (index !== -1) {
                this.users[userId].splice(index, 1);
                if (this.users[userId].length === 0) {
                    delete this.users[userId]; // Remove user if no sockets left
                }
                break;
            }
        }

        // Remove user from all rooms they were part of
        for (const room in this.rooms) {
            const index = this.rooms[room].indexOf(client.id);
            if (index !== -1) {
                this.rooms[room].splice(index, 1);
                this.server.to(room).emit('user-left', {
                    room,
                    userId: client.id,
                    message: `User ${client.id} left the room.`,
                });
            }
        }
    }

    // Register user when they connect
    @SubscribeMessage('registerUser')
    registerUser(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
        // Store socket ID under the userId
        if (!this.users[userId]) {
            this.users[userId] = [];
        }

        // Avoid duplicates
        if (!this.users[userId].includes(client.id)) {
            this.users[userId].push(client.id);
        }

        console.log(`User ${userId} registered with socket ID: ${client.id}`);
        console.log('Current Users:', this.users);
    }

    // Join a chat room
    @SubscribeMessage('joinRoom')
    joinRoom(
        @MessageBody() data: { room: string; userId: string },
        @ConnectedSocket() client: Socket
    ) {
        const { room, userId } = data;

        // Check if the user is registered before joining
        if (!this.users[userId]) {
            console.log(`User ${userId} is not registered. Please register before joining.`);
            return;
        }

        // Create room if not exists
        if (!this.rooms[room]) {
            this.rooms[room] = [];
        }

        // Add userId to the room if not already present
        if (!this.rooms[room].includes(userId)) {
            this.rooms[room].push(userId);
        }

        // Join the socket to the room in Socket.IO
        client.join(room);

        console.log(`User ${userId} joined room: ${room}`);
        console.log(`Current Room Members in ${room}:`, this.rooms[room]);

        this.server.to(room).emit('user-joined', {
            room,
            userId,
            message: `User ${userId} joined the room.`,
        });
    }

    // Handle sending messages and images
    @SubscribeMessage('sendMessage')
    handleMessage(
        @MessageBody() data: {
            senderId: string;
            message?: string; // Optional message
            image?: string;   // Optional image (Base64)
            room?: string;
            toUserId?: string;
        },
        @ConnectedSocket() client: Socket
    ) {
        console.log(`Message from ${data.senderId} to ${data.room || data.toUserId}`);

        // Handle image upload (if present)
        let imageUrl: string | null = null;
        if (data.image) {
            try {
                var base64Data = data.image.split(';base64,').pop();
                const imageName = `image-${Date.now()}.png`;
                const imagePath = path.join('D:', 'ChatImages', imageName);

                // Create directory if not exists
                const dirPath = path.dirname(imagePath);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }

                // Check if base64Data is valid before writing
                if (base64Data) {
                    fs.writeFileSync(imagePath, base64Data, { encoding: 'base64' });
                    console.log(`Image uploaded successfully: ${imagePath}`);

                    // Image URL to be sent to clients
                    imageUrl = `http://localhost:3002/images/${imageName}`;
                    // console.log("bdata",base64Data);
                    
                } else {
                    console.error('Invalid image data.');
                    client.emit('imageUploadError', {
                        message: 'Invalid image data',
                    });
                    return;
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                client.emit('imageUploadError', {
                    message: 'Failed to upload image',
                });
                return;
            }
        }

        // Check if it's a room message
        if (data.room) {
            const roomMembers = this.rooms[data.room];
            if (roomMembers && roomMembers.length > 0) {
                roomMembers.forEach((userId) => {
                    const socketIds = this.users[userId];
                    socketIds.forEach((socketId) => {
                        this.server.to(socketId).emit('receiveMessage', {
                            senderId: data.senderId,
                            room: data.room,
                            message: data.message,
                            imageUrl,
                            base64Data
                        });
                    });
                });
            }
        }

        // Send to specific user by ID (if provided)
        if (data.toUserId) {
            const targetSocketIds = this.users[data.toUserId];
            if (targetSocketIds) {
                targetSocketIds.forEach((socketId) => {
                    this.server.to(socketId).emit('receiveMessage', {
                        senderId: data.senderId,
                        message: data.message,
                        imageUrl,
                    });
                });
            }
        }
    }
}
*/

/* code to manage all type of files;  */

/*
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';

@WebSocketGateway(3002, { cors: true })
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    // Store users and rooms
    private users: { [userId: string]: string[] } = {}; // userId -> array of socketIds
    private rooms: { [roomName: string]: string[] } = {}; // roomName -> array of userIds

    // Handle user connection
    handleConnection(@ConnectedSocket() client: Socket) {
        console.log(`User connected: ${client.id}`);
    }

    // Handle user disconnection
    handleDisconnect(@ConnectedSocket() client: Socket) {
        console.log(`User disconnected: ${client.id}`);

        // Remove socket ID from all users
        for (const userId in this.users) {
            const index = this.users[userId].indexOf(client.id);
            if (index !== -1) {
                this.users[userId].splice(index, 1);
                if (this.users[userId].length === 0) {
                    delete this.users[userId]; // Remove user if no sockets left
                }
                break;
            }
        }

        // Remove user from all rooms they were part of
        for (const room in this.rooms) {
            const index = this.rooms[room].indexOf(client.id);
            if (index !== -1) {
                this.rooms[room].splice(index, 1);
                this.server.to(room).emit('user-left', {
                    room,
                    userId: client.id,
                    message: `User ${client.id} left the room.`,
                });
            }
        }
    }

    // Register user when they connect
    @SubscribeMessage('registerUser')
    registerUser(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
        // Store socket ID under the userId
        if (!this.users[userId]) {
            this.users[userId] = [];
        }

        // Avoid duplicates
        if (!this.users[userId].includes(client.id)) {
            this.users[userId].push(client.id);
        }

        console.log(`User ${userId} registered with socket ID: ${client.id}`);
        console.log('Current Users:', this.users);
    }

    // Join a chat room
    @SubscribeMessage('joinRoom')
    joinRoom(
        @MessageBody() data: { room: string; userId: string },
        @ConnectedSocket() client: Socket
    ) {
        const { room, userId } = data;

        // Check if the user is registered before joining
        if (!this.users[userId]) {
            console.log(`User ${userId} is not registered. Please register before joining.`);
            return;
        }

        // Create room if not exists
        if (!this.rooms[room]) {
            this.rooms[room] = [];
        }

        // Add userId to the room if not already present
        if (!this.rooms[room].includes(userId)) {
            this.rooms[room].push(userId);
        }

        // Join the socket to the room in Socket.IO
        client.join(room);

        console.log(`User ${userId} joined room: ${room}`);
        console.log(`Current Room Members in ${room}:`, this.rooms[room]);

        this.server.to(room).emit('user-joined', {
            room,
            userId,
            message: `User ${userId} joined the room.`,
        });
    }

    // Handle sending messages and files
    @SubscribeMessage('sendMessage')
    handleMessage(
        @MessageBody() data: {
            senderId: string;
            message?: string; // Optional message
            file?: string;    // Optional file (Base64)
            fileType?: string; // Optional file type (pdf, docx, image, etc.)
            room?: string;
            toUserId?: string;
        },
        @ConnectedSocket() client: Socket
    ) {
        console.log(`Message from ${data.senderId} to ${data.room || data.toUserId}`);

        // Handle file upload (if present)
        let fileUrl: string | null = null;
        if (data.file) {
            try {
                const base64Data = data.file.split(';base64,').pop();
                if (!base64Data) {
                    console.error('Invalid file data.');
                    client.emit('fileUploadError', { message: 'Invalid file data' });
                    return;
                }

                // Generate a unique file name
                const fileName = `${Date.now()}.${data.fileType}`;
                const filePath = path.join('D:', 'ChatFiles', fileName);

                // Create directory if not exists
                const dirPath = path.dirname(filePath);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }

                // Write file to disk
                fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
                console.log(`File uploaded successfully: ${filePath}`);

                // File URL to be sent to clients
                fileUrl = `http://localhost:3002/files/${fileName}`;
            } catch (error) {
                console.error('Error uploading file:', error);
                client.emit('fileUploadError', { message: 'Failed to upload file' });
                return;
            }
        }

        // Check if it's a room message
        if (data.room) {
            const roomMembers = this.rooms[data.room];
            if (roomMembers && roomMembers.length > 0) {
                roomMembers.forEach((userId) => {
                    const socketIds = this.users[userId];
                    socketIds.forEach((socketId) => {
                        this.server.to(socketId).emit('receiveMessage', {
                            senderId: data.senderId,
                            room: data.room,
                            message: data.message,
                            fileUrl,
                        });
                    });
                });
            }
        }

        // Send to specific user by ID (if provided)
        if (data.toUserId) {
            const targetSocketIds = this.users[data.toUserId];
            if (targetSocketIds) {
                targetSocketIds.forEach((socketId) => {
                    this.server.to(socketId).emit('receiveMessage', {
                        senderId: data.senderId,
                        message: data.message,
                        fileUrl,
                    });
                });
            }
        }
    }
}
*/

/* code to access all type of files using binary blob */

/*
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';

@WebSocketGateway(3002, { cors: true })
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    // Store users and rooms
    private users: { [userId: string]: string[] } = {}; // userId -> array of socketIds
    private rooms: { [roomName: string]: string[] } = {}; // roomName -> array of userIds

    // Handle user connection
    handleConnection(@ConnectedSocket() client: Socket) {
        console.log(`User connected: ${client.id}`);
    }

    // Handle user disconnection
    handleDisconnect(@ConnectedSocket() client: Socket) {
        console.log(`User disconnected: ${client.id}`);

        // Remove socket ID from all users
        for (const userId in this.users) {
            const index = this.users[userId].indexOf(client.id);
            if (index !== -1) {
                this.users[userId].splice(index, 1);
                if (this.users[userId].length === 0) {
                    delete this.users[userId];
                }
                break;
            }
        }

        // Remove user from all rooms they were part of
        for (const room in this.rooms) {
            const index = this.rooms[room].indexOf(client.id);
            if (index !== -1) {
                this.rooms[room].splice(index, 1);
                this.server.to(room).emit('user-left', {
                    room,
                    userId: client.id,
                    message: `User ${client.id} left the room.`,
                });
            }
        }
    }

    // Register user when they connect
    @SubscribeMessage('registerUser')
    registerUser(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
        if (!this.users[userId]) {
            this.users[userId] = [];
        }

        if (!this.users[userId].includes(client.id)) {
            this.users[userId].push(client.id);
        }
        console.log(`User ${userId} registered with socket ID: ${client.id}`);
        console.log('Current Users:', this.users);
    }

    // Join a chat room
    @SubscribeMessage('joinRoom')
    joinRoom(
        @MessageBody() data: { room: string; userId: string },
        @ConnectedSocket() client: Socket
    ) {
        const { room, userId } = data;

        if (!this.users[userId]) {
            console.log(`User ${userId} is not registered.`);
            return;
        }

        if (!this.rooms[room]) {
            this.rooms[room] = [];
        }

        if (!this.rooms[room].includes(userId)) {
            this.rooms[room].push(userId);
        }

        client.join(room);

        console.log(`User ${userId} joined room: ${room}`);
        this.server.to(room).emit('user-joined', {
            room,
            userId,
            message: `User ${userId} joined the room.`,
        });
    }

    // Handle sending messages and files (binary blob)
    @SubscribeMessage('sendMessage')
    handleMessage(
        @MessageBody() data: {
            senderId: string;
            message?: string;
            filePath?: string;  // File is sent by its path
            fileType?: string;  // Optional file type (pdf, docx, image, etc.)
            room?: string;
            toUserId?: string;
        },
        @ConnectedSocket() client: Socket
    ) {
        console.log(`Message from ${data.senderId} to ${data.room || data.toUserId}`);

        let fileUrl: string | null = null;

        // Handle file upload by path
        if (data.filePath) {
            try {
                const filePath = data.filePath;

                // Check if the file exists
                if (!fs.existsSync(filePath)) {
                    console.error('File not found at the specified path.');
                    client.emit('fileUploadError', { message: 'File not found' });
                    return;
                }

                // Generate a unique file name (Optional: retain the file extension)
                const fileName = path.basename(filePath);
                const storagePath = path.join('D:', 'ChatFiles', fileName);  // Change to the desired directory

                // Check if the directory exists, if not, create it
                const dirPath = path.dirname(storagePath);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }

                // Read and write the file to the storage path
                const fileStream = fs.createReadStream(filePath);
                const writeStream = fs.createWriteStream(storagePath);

                fileStream.pipe(writeStream);

                writeStream.on('finish', () => {
                    console.log(`File stored successfully at ${storagePath}`);
                    fileUrl = `http:// 192.168.0.201:3002/files/${fileName}`;

                    // Broadcast the file as a binary blob
                    this.sendFileToUsers(data, fileUrl, storagePath);
                });

                // Error handling for file write
                writeStream.on('error', (error) => {
                    console.error('Error writing file to storage:', error);
                    client.emit('fileUploadError', { message: 'Failed to save file' });
                });

            } catch (error) {
                console.error('Error handling file upload:', error);
                client.emit('fileUploadError', { message: 'Failed to upload file' });
            }
        }

        // Handle room message
        if (data.room) {
            const roomMembers = this.rooms[data.room];
            if (roomMembers && roomMembers.length > 0) {
                roomMembers.forEach((userId) => {
                    const socketIds = this.users[userId];
                    socketIds.forEach((socketId) => {
                        this.server.to(socketId).emit('receiveMessage', {
                            senderId: data.senderId,
                            room: data.room,
                            message: data.message,
                            fileUrl,
                        });
                    });
                });
            }
        }

        // Send to specific user by ID (if provided)
        if (data.toUserId) {
            const targetSocketIds = this.users[data.toUserId];
            if (targetSocketIds) {
                targetSocketIds.forEach((socketId) => {
                    this.server.to(socketId).emit('receiveMessage', {
                        senderId: data.senderId,
                        message: data.message,
                        fileUrl,
                    });
                });
            }
        }
    }

    // Helper method to send the file to users
    private sendFileToUsers(
        data: { senderId: string; room?: string; toUserId?: string },
        fileUrl: string | null,
        storagePath: string
    ) {
        if (data.room) {
            const roomMembers = this.rooms[data.room];
            if (roomMembers && roomMembers.length > 0) {
                roomMembers.forEach((userId) => {
                    const socketIds = this.users[userId];
                    socketIds.forEach((socketId) => {
                        this.server.to(socketId).emit('receiveMessage', {
                            senderId: data.senderId,
                            room: data.room,
                            fileUrl,
                            storagePath,  // Path of the stored file
                        });
                    });
                });
            }
        }

        // Send to specific user by ID (if provided)
        if (data.toUserId) {
            const targetSocketIds = this.users[data.toUserId];
            if (targetSocketIds) {
                targetSocketIds.forEach((socketId) => {
                    this.server.to(socketId).emit('receiveMessage', {
                        senderId: data.senderId,
                        fileUrl,
                        storagePath,  // Path of the stored file
                    });
                });
            }
        }
    }
}
*/

/* access all files and it's all data  */

/*
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';

@WebSocketGateway({ cors: true })
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    private users: { [userId: string]: string[] } = {};
    private rooms: { [roomName: string]: string[] } = {};

    handleConnection(@ConnectedSocket() client: Socket) {
        console.log(`User connected: ${client.id}`);
    }

    handleDisconnect(@ConnectedSocket() client: Socket) {
        console.log(`User disconnected: ${client.id}`);

        for (const userId in this.users) {
            const index = this.users[userId].indexOf(client.id);
            if (index !== -1) {
                this.users[userId].splice(index, 1);
                if (this.users[userId].length === 0) {
                    delete this.users[userId];
                }
                break;
            }
        }

        for (const room in this.rooms) {
            const index = this.rooms[room].indexOf(client.id);
            if (index !== -1) {
                this.rooms[room].splice(index, 1);
                this.server.to(room).emit('user-left', {
                    room,
                    userId: client.id,
                    message: `User ${client.id} left the room.`,
                });
            }
        }
    }

    @SubscribeMessage('registerUser')
    registerUser(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
        if (!this.users[userId]) {
            this.users[userId] = [];
        }
        if (!this.users[userId].includes(client.id)) {
            this.users[userId].push(client.id);
        }

        console.log(`User ${userId} registered with socket ID: ${client.id}`);
        console.log('Current Users:', this.users);
    }

    @SubscribeMessage('joinRoom')
    joinRoom(
        @MessageBody() data: { room: string; userId: string },
        @ConnectedSocket() client: Socket
    ) {
        const { room, userId } = data;

        if (!this.users[userId]) {
            console.log(`User ${userId} is not registered.`);
            return;
        }

        if (!this.rooms[room]) {
            this.rooms[room] = [];
        }

        if (!this.rooms[room].includes(userId)) {
            this.rooms[room].push(userId);
        }

        client.join(room);

        console.log(`User ${userId} joined room: ${room}`);
        console.log(`Current Room Members in ${room}:`, this.rooms[room]);

        this.server.to(room).emit('user-joined', {
            room,
            userId,
            message: `User ${userId} joined the room.`,
        });
    }
    @SubscribeMessage('sendMessage')
handleMessage(
    @MessageBody() data: {
        senderId: string;
        message?: string;
        filePath?: string; // File path instead of base64
        room?: string;
        toUserId?: string;
    },
    @ConnectedSocket() client: Socket
) {
    console.log(`Message from ${data.senderId} to ${data.room || data.toUserId}`);

    let fileUrl: string | null = null;
    let fileName: string | null = null;
    let fileType: string | null = null;
    let fileSizeKB: number | null = null;

    if (data.filePath) {
        try {
            const originalFileName = path.basename(data.filePath);
            const newFileName = `${Date.now()}_${originalFileName}`;
            const targetPath = path.join(__dirname, '..', '..', 'public', 'uploads', newFileName);

            // Create the upload directory if it doesn't exist
            const uploadDir = path.dirname(targetPath);
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Move file to the public/uploads directory
            fs.copyFileSync(data.filePath, targetPath);
            console.log(`File moved successfully: ${targetPath}`);

            // Extract file details
            fileName = originalFileName;
            fileType = path.extname(originalFileName).substring(1); // Extract file extension
            const stats = fs.statSync(targetPath);
            fileSizeKB = parseFloat((stats.size / 1024).toFixed(2)); // Convert bytes to KB

            console.log("File Name:", fileName);
            console.log("File Type:", fileType);
            console.log("File Size:", fileSizeKB, "KB");

            // Generate public URL for the uploaded file
            fileUrl = `http://192.168.0.201:3000/uploads/${newFileName}`;
        } catch (error) {
            console.error('Error moving file:', error);
            client.emit('fileUploadError', { message: 'Failed to upload file' });
            return;
        }
    }

    // Construct the message payload
    const messagePayload = {
        senderId: data.senderId,
        room: data.room,
        message: data.message,
        fileUrl,
        fileName,
        fileType,
        fileSizeKB,
    };

    // Send to all users in a room
    if (data.room) {
        const roomMembers = this.rooms[data.room];
        if (roomMembers && roomMembers.length > 0) {
            roomMembers.forEach((userId) => {
                const socketIds = this.users[userId];
                socketIds.forEach((socketId) => {
                    this.server.to(socketId).emit('receiveMessage', messagePayload);
                });
            });
        }
    }

    // Send to a specific user
    if (data.toUserId) {
        const targetSocketIds = this.users[data.toUserId];
        if (targetSocketIds) {
            targetSocketIds.forEach((socketId) => {
                this.server.to(socketId).emit('receiveMessage', messagePayload);
            });
        }
    }
}

}
*/

/* code to add restriction and limitation to all files and size */

/*
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver'; // For zipping files

@WebSocketGateway({ cors: true })
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    private users: { [userId: string]: string[] } = {};
    private rooms: { [roomName: string]: string[] } = {};

    handleConnection(@ConnectedSocket() client: Socket) {
        console.log(`User connected: ${client.id}`);
    }

    handleDisconnect(@ConnectedSocket() client: Socket) {
        console.log(`User disconnected: ${client.id}`);

        for (const userId in this.users) {
            const index = this.users[userId].indexOf(client.id);
            if (index !== -1) {
                this.users[userId].splice(index, 1);
                if (this.users[userId].length === 0) {
                    delete this.users[userId];
                }
                break;
            }
        }

        for (const room in this.rooms) {
            const index = this.rooms[room].indexOf(client.id);
            if (index !== -1) {
                this.rooms[room].splice(index, 1);
                this.server.to(room).emit('user-left', {
                    room,
                    userId: client.id,
                    message: `User ${client.id} left the room.`,
                });
            }
        }
    }

    @SubscribeMessage('registerUser')
    registerUser(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
        if (!this.users[userId]) {
            this.users[userId] = [];
        }
        if (!this.users[userId].includes(client.id)) {
            this.users[userId].push(client.id);
        }

        console.log(`User ${userId} registered with socket ID: ${client.id}`);
        console.log('Current Users:', this.users);
    }

    @SubscribeMessage('joinRoom')
    joinRoom(
        @MessageBody() data: { room: string; userId: string },
        @ConnectedSocket() client: Socket
    ) {
        const { room, userId } = data;

        if (!this.users[userId]) {
            console.log(`User ${userId} is not registered.`);
            return;
        }

        if (!this.rooms[room]) {
            this.rooms[room] = [];
        }

        if (!this.rooms[room].includes(userId)) {
            this.rooms[room].push(userId);
        }

        client.join(room);

        console.log(`User ${userId} joined room: ${room}`);
        console.log(`Current Room Members in ${room}:`, this.rooms[room]);

        this.server.to(room).emit('user-joined', {
            room,
            userId,
            message: `User ${userId} joined the room.`,
        });
    }

    @SubscribeMessage('sendMessage')
    handleMessage(
        @MessageBody() data: {
            senderId: string;
            message?: string;
            filePath?: string;
            room?: string;
            toUserId?: string;
        },
        @ConnectedSocket() client: Socket
    ) {
        console.log(`Message from ${data.senderId} to ${data.room || data.toUserId}`);

        let fileUrl: string | null = null;
        let fileName: string | null = null;
        let fileType: string | null = null;
        let fileSizeKB: number | null = null;

        const allowedImages = ['jpg', 'jpeg', 'png', 'gif'];
        const allowedFiles = ['mp4', 'mp3', 'pdf', 'docx', 'xlsx', 'zip', 'vcf', 'txt'];

        if (data.filePath) {
            try {
                const originalFileName = path.basename(data.filePath);
                let newFileName = `${Date.now()}_${originalFileName}`;
                let targetPath = path.join(__dirname, '..', '..', 'public', 'uploads', newFileName);

                // Extract file details
                fileType = path.extname(originalFileName).substring(1).toLowerCase();
                const stats = fs.statSync(data.filePath);
                fileSizeKB = parseFloat((stats.size / 1024).toFixed(2)); // Convert bytes to KB
                fileName=originalFileName;
                console.log("File Name:", originalFileName);
                console.log("File Type:", fileType);
                console.log("File Size:", fileSizeKB, "KB");

                // Validate file type and size
                if (allowedImages.includes(fileType) && fileSizeKB > 16384) {
                    console.log('Image file exceeds 16MB limit');
                    client.emit('fileUploadError', { message: 'Image file size exceeds 16MB limit' });
                    return;
                } else if (allowedFiles.includes(fileType) && fileSizeKB > 102400) {
                    console.log('File exceeds 100MB limit');
                    client.emit('fileUploadError', { message: 'File size exceeds 100MB limit' });
                    return;
                } else if (!allowedImages.includes(fileType) && !allowedFiles.includes(fileType)) {
                    // Unsupported file: Zip it
                    console.log(`Unsupported file detected. Zipping before sending...`);
                    const zipFileName = `${Date.now()}_${originalFileName}.zip`;
                    const zipTargetPath = path.join(__dirname, '..', '..', 'public', 'uploads', zipFileName);

                    const output = fs.createWriteStream(zipTargetPath);
                    const archive = archiver('zip', { zlib: { level: 9 } });

                    output.on('close', () => {
                        console.log(`Zipped file created: ${zipFileName}`);
                    });

                    archive.pipe(output);
                    archive.file(data.filePath, { name: originalFileName });
                    archive.finalize();

                    // Update file details
                    newFileName = zipFileName;
                    targetPath = zipTargetPath;
                    fileType = 'zip';
                }

                // Create upload directory if it doesn't exist
                const uploadDir = path.dirname(targetPath);
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                // Move the file to public/uploads directory
                if (!fs.existsSync(targetPath)) {
                    fs.copyFileSync(data.filePath, targetPath);
                }

                // Generate file URL
                fileUrl = `http://192.168.0.201:3000/uploads/${newFileName}`;
            } catch (error) {
                console.error('Error processing file:', error);
                client.emit('fileUploadError', { message: 'Failed to process file' });
                return;
            }
        }

        // Construct the message payload
        const messagePayload = {
            senderId: data.senderId,
            room: data.room,
            message: data.message,
            fileUrl,
            fileName,
            fileType,
            fileSizeKB,
        };

        // Send message to users
        if (data.room) {
            this.rooms[data.room]?.forEach(userId => {
                this.users[userId]?.forEach(socketId => {
                    this.server.to(socketId).emit('receiveMessage', messagePayload);
                });
            });
        }
        if (data.toUserId) {
            this.users[data.toUserId]?.forEach(socketId => {
                this.server.to(socketId).emit('receiveMessage', messagePayload);
            });
        }
    }
}
*/

/* code that shows only msg and omitted file data - accepts any users */

/*
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver'; // For zipping files

@WebSocketGateway({ cors: true })
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    private users: { [userId: string]: string[] } = {};
    private rooms: { [roomName: string]: string[] } = {};

    handleConnection(@ConnectedSocket() client: Socket) {
        console.log(`User connected: ${client.id}`);
    }

    handleDisconnect(@ConnectedSocket() client: Socket) {
        console.log(`User disconnected: ${client.id}`);

        for (const userId in this.users) {
            const index = this.users[userId].indexOf(client.id);
            if (index !== -1) {
                this.users[userId].splice(index, 1);
                if (this.users[userId].length === 0) {
                    delete this.users[userId];
                }
                break;
            }
        }

        for (const room in this.rooms) {
            const index = this.rooms[room].indexOf(client.id);
            if (index !== -1) {
                this.rooms[room].splice(index, 1);
                this.server.to(room).emit('user-left', {
                    room,
                    userId: client.id,
                    message: `User ${client.id} left the room.`,
                });
            }
        }
    }

    @SubscribeMessage('registerUser')
    registerUser(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
        if (!this.users[userId]) {
            this.users[userId] = [];
        }
        if (!this.users[userId].includes(client.id)) {
            this.users[userId].push(client.id);
        }

        console.log(`User ${userId} registered with socket ID: ${client.id}`);
        console.log('Current Users:', this.users);
    }

    @SubscribeMessage('joinRoom')
    joinRoom(
        @MessageBody() data: { room: string; userId: string },
        @ConnectedSocket() client: Socket
    ) {
        const { room, userId } = data;

        if (!this.users[userId]) {
            console.log(`User ${userId} is not registered.`);
            return;
        }

        if (!this.rooms[room]) {
            this.rooms[room] = [];
        }

        if (!this.rooms[room].includes(userId)) {
            this.rooms[room].push(userId);
        }

        client.join(room);

        console.log(`User ${userId} joined room: ${room}`);
        console.log(`Current Room Members in ${room}:`, this.rooms[room]);

        this.server.to(room).emit('user-joined', {
            room,
            userId,
            message: `User ${userId} joined the room.`,
        });
    }

    @SubscribeMessage('sendMessage')
    handleMessage(
        @MessageBody() data: {
            senderId: string;
            message?: string;
            filePath?: string;
            room?: string;
            toUserId?: string;
        },
        @ConnectedSocket() client: Socket
    ) {
        console.log(`Message from ${data.senderId} to ${data.room || data.toUserId}`);

        const allowedImages = ['jpg', 'jpeg', 'png', 'gif'];
        const allowedFiles = ['mp4', 'mp3', 'pdf', 'docx', 'xlsx', 'zip', 'vcf', 'txt'];

        let fileData: any = {}; // Object to store file-related details dynamically

        if (data.filePath) {
            try {
                const originalFileName = path.basename(data.filePath);
                let newFileName = `${Date.now()}_${originalFileName}`;
                let targetPath = path.join(__dirname, '..', '..', 'public', 'uploads', newFileName);

                const fileType = path.extname(originalFileName).substring(1).toLowerCase();
                const stats = fs.statSync(data.filePath);
                const fileSizeKB = parseFloat((stats.size / 1024).toFixed(2));

                console.log("File Name:", originalFileName);
                console.log("File Type:", fileType);
                console.log("File Size:", fileSizeKB, "KB");

                // Validate file type and size
                if (allowedImages.includes(fileType) && fileSizeKB > 16384) {
                    console.log('Image file exceeds 16MB limit');
                    client.emit('fileUploadError', { message: 'Image file size exceeds 16MB limit' });
                    return;
                } else if (allowedFiles.includes(fileType) && fileSizeKB > 102400) {
                    console.log('File exceeds 100MB limit');
                    client.emit('fileUploadError', { message: 'File size exceeds 100MB limit' });
                    return;
                } else if (!allowedImages.includes(fileType) && !allowedFiles.includes(fileType)) {
                    // Unsupported file: Zip it
                    console.log(`Unsupported file detected. Zipping before sending...`);
                    const zipFileName = `${Date.now()}_${originalFileName}.zip`;
                    const zipTargetPath = path.join(__dirname, '..', '..', 'public', 'uploads', zipFileName);

                    const output = fs.createWriteStream(zipTargetPath);
                    const archive = archiver('zip', { zlib: { level: 9 } });

                    output.on('close', () => {
                        console.log(`Zipped file created: ${zipFileName}`);
                    });

                    archive.pipe(output);
                    archive.file(data.filePath, { name: originalFileName });
                    archive.finalize();

                    // Update file details
                    newFileName = zipFileName;
                    targetPath = zipTargetPath;

                    fileData.fileType = 'zip';
                }

                // Create upload directory if it doesn't exist
                const uploadDir = path.dirname(targetPath);
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                // Move the file to public/uploads directory
                if (!fs.existsSync(targetPath)) {
                    fs.copyFileSync(data.filePath, targetPath);
                }

                // ✅ Only include file details if a file exists
                fileData = {
                    fileUrl: `http://192.168.0.201:3000/uploads/${newFileName}`,
                    fileName: originalFileName,
                    fileType,
                    fileSizeKB,
                };

            } catch (error) {
                console.error('Error processing file:', error);
                client.emit('fileUploadError', { message: 'Failed to process file' });
                return;
            }
        }

        // Construct the message payload dynamically
        const messagePayload: any = {
            senderId: data.senderId,
            room: data.room,
            message: data.message,
            ...fileData, // ✅ Only includes file-related fields if a file was provided
        };

        // Send message to users
        if (data.room) {
            this.rooms[data.room]?.forEach(userId => {
                this.users[userId]?.forEach(socketId => {
                    this.server.to(socketId).emit('receiveMessage', messagePayload);
                });
            });
        }
        if (data.toUserId) {
            this.users[data.toUserId]?.forEach(socketId => {
                this.server.to(socketId).emit('receiveMessage', messagePayload);
            });
        }
    }
}
*/


/* total storage of folder */

/*
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';

@WebSocketGateway({ cors: true })
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    private users: { [userId: string]: string[] } = {};
    private rooms: { [roomName: string]: string[] } = {};

    private uploadsFolder = path.join(__dirname, '..', '..', 'public', 'uploads'); // Storage folder

    handleConnection(@ConnectedSocket() client: Socket) {
        console.log(`User connected: ${client.id}`);
    }

    handleDisconnect(@ConnectedSocket() client: Socket) {
        console.log(`User disconnected: ${client.id}`);

        for (const userId in this.users) {
            const index = this.users[userId].indexOf(client.id);
            if (index !== -1) {
                this.users[userId].splice(index, 1);
                if (this.users[userId].length === 0) {
                    delete this.users[userId];
                }
                break;
            }
        }

        for (const room in this.rooms) {
            const index = this.rooms[room].indexOf(client.id);
            if (index !== -1) {
                this.rooms[room].splice(index, 1);
                this.server.to(room).emit('user-left', {
                    room,
                    userId: client.id,
                    message: `User ${client.id} left the room.`,
                });
            }
        }
    }

    @SubscribeMessage('registerUser')
    registerUser(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
        if (!this.users[userId]) {
            this.users[userId] = [];
        }
        if (!this.users[userId].includes(client.id)) {
            this.users[userId].push(client.id);
        }

        console.log(`User ${userId} registered with socket ID: ${client.id}`);
        console.log('Current Users:', this.users);
    }

    @SubscribeMessage('joinRoom')
    joinRoom(
        @MessageBody() data: { room: string; userId: string },
        @ConnectedSocket() client: Socket
    ) {
        const { room, userId } = data;

        if (!this.users[userId]) {
            console.log(`User ${userId} is not registered.`);
            return;
        }

        if (!this.rooms[room]) {
            this.rooms[room] = [];
        }

        if (!this.rooms[room].includes(userId)) {
            this.rooms[room].push(userId);
        }

        client.join(room);

        console.log(`User ${userId} joined room: ${room}`);
        console.log(`Current Room Members in ${room}:`, this.rooms[room]);

        this.server.to(room).emit('user-joined', {
            room,
            userId,
            message: `User ${userId} joined the room.`,
        });
    }

    @SubscribeMessage('sendMessage')
    handleMessage(
        @MessageBody() data: {
            senderId: string;
            message?: string;
            filePath?: string;
            room?: string;
            toUserId?: string;
        },
        @ConnectedSocket() client: Socket
    ) {
        console.log(`Message from ${data.senderId} to ${data.room || data.toUserId}`);

        const allowedImages = ['jpg', 'jpeg', 'png', 'gif'];
        const allowedFiles = ['mp4', 'mp3', 'pdf', 'docx', 'xlsx', 'zip', 'vcf', 'txt'];

        let fileData: any = {}; // Object to store file-related details dynamically

        if (data.filePath) {
            try {
                const originalFileName = path.basename(data.filePath);
                let newFileName = `${Date.now()}_${originalFileName}`;
                let targetPath = path.join(this.uploadsFolder, newFileName);

                const fileType = path.extname(originalFileName).substring(1).toLowerCase();
                const stats = fs.statSync(data.filePath);
                const fileSizeKB = parseFloat((stats.size / 1024).toFixed(2));

                console.log("File Name:", originalFileName);
                console.log("File Type:", fileType);
                console.log("File Size:", fileSizeKB, "KB");

                // Validate file type and size
                if (allowedImages.includes(fileType) && fileSizeKB > 16384) {
                    console.log('Image file exceeds 16MB limit');
                    client.emit('fileUploadError', { message: 'Image file size exceeds 16MB limit' });
                    return;
                } else if (allowedFiles.includes(fileType) && fileSizeKB > 102400) {
                    console.log('File exceeds 100MB limit');
                    client.emit('fileUploadError', { message: 'File size exceeds 100MB limit' });
                    return;
                } else if (!allowedImages.includes(fileType) && !allowedFiles.includes(fileType)) {
                    // Unsupported file: Zip it
                    console.log(`Unsupported file detected. Zipping before sending...`);
                    const zipFileName = `${Date.now()}_${originalFileName}.zip`;
                    const zipTargetPath = path.join(this.uploadsFolder, zipFileName);

                    const output = fs.createWriteStream(zipTargetPath);
                    const archive = archiver('zip', { zlib: { level: 9 } });

                    output.on('close', () => {
                        console.log(`Zipped file created: ${zipFileName}`);
                    });

                    archive.pipe(output);
                    archive.file(data.filePath, { name: originalFileName });
                    archive.finalize();

                    // Update file details
                    newFileName = zipFileName;
                    targetPath = zipTargetPath;
                    fileData.fileType = 'zip';
                }

                // Ensure uploads folder exists
                if (!fs.existsSync(this.uploadsFolder)) {
                    fs.mkdirSync(this.uploadsFolder, { recursive: true });
                }

                // Move the file to public/uploads directory
                if (!fs.existsSync(targetPath)) {
                    fs.copyFileSync(data.filePath, targetPath);
                }

                // ✅ Calculate storage usage
                const totalStorageKB = this.getFolderSizeKB(this.uploadsFolder);

                // ✅ Include file details and storage usage
                fileData = {
                    fileUrl: `http://192.168.0.201:3000/uploads/${newFileName}`,
                    fileName: originalFileName,
                    fileType,
                    fileSizeKB,
                    storageUsedKB: totalStorageKB, // Total storage used
                };

            } catch (error) {
                console.error('Error processing file:', error);
                client.emit('fileUploadError', { message: 'Failed to process file' });
                return;
            }
        }

        // Construct the message payload dynamically
        const messagePayload: any = {
            senderId: data.senderId,
            room: data.room,
            message: data.message,
            ...fileData, // ✅ Only includes file-related fields if a file was provided
        };

        // Send message to users
        if (data.room) {
            this.rooms[data.room]?.forEach(userId => {
                this.users[userId]?.forEach(socketId => {
                    this.server.to(socketId).emit('receiveMessage', messagePayload);
                });
            });
        }
        if (data.toUserId) {
            this.users[data.toUserId]?.forEach(socketId => {
                this.server.to(socketId).emit('receiveMessage', messagePayload);
            });
        }
    }

    
    //  * Calculates the total size of the uploads folder in KB
     
    private getFolderSizeKB(folderPath: string): number {
        let totalSize = 0;
        if (fs.existsSync(folderPath)) {
            const files = fs.readdirSync(folderPath);
            files.forEach(file => {
                const filePath = path.join(folderPath, file);
                const stats = fs.statSync(filePath);
                if (stats.isFile()) {
                    totalSize += stats.size;
                }
            });
        }
        return parseFloat((totalSize / 1024).toFixed(2)); // Convert bytes to KB
    }
}
*/

/* modified code in 20/02/25 - accepts only the user within the room... */

import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver'; // For zipping files

@WebSocketGateway({ cors: true })
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    private users: { [userId: string]: string[] } = {};
    private rooms: { [roomName: string]: string[] } = {};

    handleConnection(@ConnectedSocket() client: Socket) {
        console.log(`User connected: ${client.id}`);
    }

    handleDisconnect(@ConnectedSocket() client: Socket) {
        console.log(`User disconnected: ${client.id}`);

        for (const userId in this.users) {
            const index = this.users[userId].indexOf(client.id);
            if (index !== -1) {
                this.users[userId].splice(index, 1);
                if (this.users[userId].length === 0) {
                    delete this.users[userId];
                }
                break;
            }
        }

        for (const room in this.rooms) {
            const index = this.rooms[room].indexOf(client.id);
            if (index !== -1) {
                this.rooms[room].splice(index, 1);
                this.server.to(room).emit('user-left', {
                    room,
                    userId: client.id,
                    message: `User ${client.id} left the room.`,
                });
            }
        }
    }

    @SubscribeMessage('registerUser')
    registerUser(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
        if (!this.users[userId]) {
            this.users[userId] = [];
        }
        if (!this.users[userId].includes(client.id)) {
            this.users[userId].push(client.id);
        }

        console.log(`User ${userId} registered with socket ID: ${client.id}`);
        console.log('Current Users:', this.users);
    }

    @SubscribeMessage('joinRoom')
    joinRoom(
        @MessageBody() data: { room: string; userId: string },
        @ConnectedSocket() client: Socket
    ) {
        const { room, userId } = data;

        if (!this.users[userId]) {
            console.log(`User ${userId} is not registered.`);
            return;
        }

        if (!this.rooms[room]) {
            this.rooms[room] = [];
        }

        if (!this.rooms[room].includes(userId)) {
            this.rooms[room].push(userId);
        }

        client.join(room);

        console.log(`User ${userId} joined room: ${room}`);
        console.log(`Current Room Members in ${room}:`, this.rooms[room]);

        this.server.to(room).emit('user-joined', {
            room,
            userId,
            message: `User ${userId} joined the room.`,
        });
    }

    @SubscribeMessage('sendMessage')
    handleMessage(
        @MessageBody() data: {
            senderId: string;
            message?: string;
            filePath?: string;
            room?: string;
            toUserId?: string;
        },
        @ConnectedSocket() client: Socket
    ) {
        console.log(`Message from ${data.senderId} to ${data.room || data.toUserId}`);

        if (data.room && (!this.rooms[data.room] || !this.rooms[data.room].includes(data.senderId))) {
            console.log(`Unauthorized: User ${data.senderId} is not in room ${data.room}`);
            client.emit('unauthorized', { message: 'You are not authorized to send messages in this room.' });
            return;
        }

        const allowedImages = ['jpg', 'jpeg', 'png', 'gif'];
        const allowedFiles = ['mp4', 'mp3', 'pdf', 'docx', 'xlsx', 'zip', 'vcf', 'txt'];

        let fileData: any = {}; // Object to store file-related details dynamically

        if (data.filePath) {
            try {
                const originalFileName = path.basename(data.filePath);
                let newFileName = `${Date.now()}_${originalFileName}`;
                let targetPath = path.join(__dirname, '..', '..', 'public', 'uploads', newFileName);

                const fileType = path.extname(originalFileName).substring(1).toLowerCase();
                const stats = fs.statSync(data.filePath);
                const fileSizeKB = parseFloat((stats.size / 1024).toFixed(2));

                console.log("File Name:", originalFileName);
                console.log("File Type:", fileType);
                console.log("File Size:", fileSizeKB, "KB");

                if (allowedImages.includes(fileType) && fileSizeKB > 16384) {
                    console.log('Image file exceeds 16MB limit');
                    client.emit('fileUploadError', { message: 'Image file size exceeds 16MB limit' });
                    return;
                } else if (allowedFiles.includes(fileType) && fileSizeKB > 102400) {
                    console.log('File exceeds 100MB limit');
                    client.emit('fileUploadError', { message: 'File size exceeds 100MB limit' });
                    return;
                }

                if (!fs.existsSync(path.dirname(targetPath))) {
                    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
                }

                if (!fs.existsSync(targetPath)) {
                    fs.copyFileSync(data.filePath, targetPath);
                }

                fileData = {
                    fileUrl: `http://192.168.0.201:3000/uploads/${newFileName}`,
                    fileName: originalFileName,
                    fileType,
                    fileSizeKB,
                };

            } catch (error) {
                console.error('Error processing file:', error);
                client.emit('fileUploadError', { message: 'Failed to process file' });
                return;
            }
        }

        const messagePayload: any = {
            senderId: data.senderId,
            room: data.room,
            message: data.message,
            ...fileData,
        };

        if (data.room) {
            this.rooms[data.room]?.forEach(userId => {
                this.users[userId]?.forEach(socketId => {
                    this.server.to(socketId).emit('receiveMessage', messagePayload);
                });
            });
        }
    }
}



