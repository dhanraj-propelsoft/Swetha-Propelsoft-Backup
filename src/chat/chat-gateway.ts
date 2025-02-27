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

*/

/* Diffie Hellman implement */

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
import * as crypto from 'crypto';
import * as archiver from 'archiver'; // For zipping files

@WebSocketGateway({ cors: true })
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    private users: { [userId: string]: string[] } = {};
    private rooms: { [roomName: string]: string[] } = {};
    private userKeys: { [userId: string]: { publicKey: string, sharedSecret?: string } } = {};

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

        const dh = crypto.createDiffieHellman(2048);
        const publicKey = dh.generateKeys('hex');
        this.userKeys[userId] = { publicKey };

        console.log(`User ${userId} registered with socket ID: ${client.id}`);
        client.emit('publicKey', { userId, publicKey });
    }

    @SubscribeMessage('exchangeKeys')
    exchangeKeys(@MessageBody() data: { userId: string, publicKey: string }) {
        if (this.userKeys[data.userId]) {
            const dh = crypto.createDiffieHellman(2048);
            dh.generateKeys('hex');
            const sharedSecret = dh.computeSecret(data.publicKey, 'hex', 'hex');
            this.userKeys[data.userId].sharedSecret = sharedSecret;
            console.log(`Shared secret established for user ${data.userId}`);
        }
    }

    encryptMessage(message: string, key: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(message, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    decryptMessage(encryptedMessage: string, key: string): string {
        const iv = crypto.randomBytes(16);
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedMessage, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
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
        if (!this.userKeys[data.senderId]?.sharedSecret) {
            console.log(`No shared secret for user ${data.senderId}, cannot encrypt message.`);
            return;
        }
        const encryptedMessage = this.encryptMessage(data.message || '', this.userKeys[data.senderId].sharedSecret!);
        const messagePayload: any = {
            senderId: data.senderId,
            room: data.room,
            message: encryptedMessage,
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

*/

/* DH algorithm in 24/02/24 */

/*
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as crypto from 'crypto';
import * as CryptoJS from 'crypto-js';

@WebSocketGateway({ cors: true })
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    private users: { [userId: string]: { sockets: string[], dhKeys?: { publicKey: string, privateKey: string, sharedSecret?: string } } } = {};

    // Handle user connection
    handleConnection(@ConnectedSocket() client: Socket) {
        console.log(`User connected: ${client.id}`);
    }

    // Handle user disconnection
    handleDisconnect(@ConnectedSocket() client: Socket) {
        console.log(`User disconnected: ${client.id}`);

        for (const userId in this.users) {
            const index = this.users[userId].sockets.indexOf(client.id);
            if (index !== -1) {
                this.users[userId].sockets.splice(index, 1);
                if (this.users[userId].sockets.length === 0) {
                    delete this.users[userId];
                }
                break;
            }
        }
    }

    // Register user and generate Diffie-Hellman keys
    @SubscribeMessage('registerUser')
    registerUser(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
        if (!this.users[userId]) {
            this.users[userId] = { sockets: [] };
        }
        if (!this.users[userId].sockets.includes(client.id)) {
            this.users[userId].sockets.push(client.id);
        }

        // Generate Diffie-Hellman keys
        const dh = crypto.createDiffieHellman(2048);
        const publicKey = dh.generateKeys('hex');
        const privateKey = dh.getPrivateKey('hex');

        this.users[userId].dhKeys = { publicKey, privateKey };

        console.log(`User ${userId} registered with socket ID: ${client.id}`);
        console.log('Current Users:', this.users);

        // Send public key to user
        client.emit('publicKey', { userId, publicKey });
    }

    // Receive and store the shared secret
    @SubscribeMessage('exchangeKeys')
    exchangeKeys(@MessageBody() data: { userId: string, targetUserId: string, targetPublicKey: string }) {
        const user = this.users[data.userId];
        const targetUser = this.users[data.targetUserId];

        if (!user || !targetUser || !user.dhKeys) {
            console.log(`Key exchange failed: User(s) not found`);
            return;
        }

        const dh = crypto.createDiffieHellman(2048);
        dh.setPrivateKey(user.dhKeys.privateKey, 'hex');
        dh.setPublicKey(user.dhKeys.publicKey, 'hex');

        // Compute shared secret
        const sharedSecret = dh.computeSecret(data.targetPublicKey, 'hex', 'hex');
        user.dhKeys.sharedSecret = sharedSecret;

        console.log(`Shared secret established between ${data.userId} and ${data.targetUserId}`);
    }

    // Encrypt message before sending
    private encryptMessage(message: string, secret: string): string {
        return CryptoJS.AES.encrypt(message, secret).toString();
    }

    // Decrypt message after receiving
    private decryptMessage(encryptedMessage: string, secret: string): string {
        const bytes = CryptoJS.AES.decrypt(encryptedMessage, secret);
        return bytes.toString(CryptoJS.enc.Utf8);
    }

    // Handle sending encrypted message
    @SubscribeMessage('sendMessage')
    handleMessage(@MessageBody() data: { senderId: string, message: string, room?: string, toUserId?: string }, @ConnectedSocket() client: Socket) {
        console.log(`Message from ${data.senderId} to ${data.room || data.toUserId}`);

        const sender = this.users[data.senderId];
        if (!sender || !sender.dhKeys?.sharedSecret) {
            console.log(`User ${data.senderId} has no shared secret`);
            client.emit('error', { message: 'Encryption error: Shared secret not established' });
            return;
        }

        // Encrypt message
        const encryptedMessage = this.encryptMessage(data.message, sender.dhKeys.sharedSecret);

        const messagePayload = {
            senderId: data.senderId,
            room: data.room,
            encryptedMessage,
        };

        // Send to all users in a room
        if (data.room) {
            this.server.to(data.room).emit('receiveMessage', messagePayload);
        }

        // Send to a specific user
        if (data.toUserId) {
            const target = this.users[data.toUserId];
            if (!target || !target.dhKeys?.sharedSecret) {
                console.log(`Target user ${data.toUserId} has no shared secret`);
                return;
            }
            target.sockets.forEach(socketId => {
                this.server.to(socketId).emit('receiveMessage', messagePayload);
            });
        }
    }

    // Handle receiving message and decrypting it
    @SubscribeMessage('decryptMessage')
    decryptReceivedMessage(@MessageBody() data: { userId: string, encryptedMessage: string }, @ConnectedSocket() client: Socket) {
        const user = this.users[data.userId];
        if (!user || !user.dhKeys?.sharedSecret) {
            console.log(`User ${data.userId} has no shared secret`);
            client.emit('error', { message: 'Decryption error: Shared secret not established' });
            return;
        }

        // Decrypt message
        const decryptedMessage = this.decryptMessage(data.encryptedMessage, user.dhKeys.sharedSecret);
        client.emit('decryptedMessage', { message: decryptedMessage });
    }
}

*/

/* DH algorithm with unique user */

/*
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as crypto from 'crypto';
import * as CryptoJS from 'crypto-js';

@WebSocketGateway({ cors: true })
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    private users: { [userId: string]: { sockets: string[], dhKeys?: { publicKey: string, privateKey: string, sharedSecret?: string } } } = {};

    // Handle user connection
    handleConnection(@ConnectedSocket() client: Socket) {
        console.log(`User connected: ${client.id}`);
    }

    // Handle user disconnection
    handleDisconnect(@ConnectedSocket() client: Socket) {
        console.log(`User disconnected: ${client.id}`);

        for (const userId in this.users) {
            const index = this.users[userId].sockets.indexOf(client.id);
            if (index !== -1) {
                this.users[userId].sockets.splice(index, 1);
                if (this.users[userId].sockets.length === 0) {
                    delete this.users[userId];
                }
                break;
            }
        }
    }

    // Register user and generate Diffie-Hellman keys
    @SubscribeMessage('registerUser')
registerUser(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
    // Check if userId is already registered
    if (this.users[userId]) {
        console.log(`Registration failed: User ${userId} already exists.`);
        client.emit('registrationError', { message: 'User ID already exists. Choose a different one.' });
        return;
    }

    // Register new user
    this.users[userId] = { sockets: [client.id] };

    // Generate Diffie-Hellman keys
    const dh = crypto.createDiffieHellman(2048);
    const publicKey = dh.generateKeys('hex');
    const privateKey = dh.getPrivateKey('hex');

    this.users[userId].dhKeys = { publicKey, privateKey };

    console.log(`User ${userId} registered with socket ID: ${client.id}`);
    console.log('Current Users:', this.users);

    // Send public key to user
    client.emit('publicKey', { userId, publicKey });
}

    // Encrypt message before sending
    private encryptMessage(message: string, secret: string): string {
        return CryptoJS.AES.encrypt(message, secret).toString();
    }

    // Decrypt message after receiving
    private decryptMessage(encryptedMessage: string, secret: string): string {
        const bytes = CryptoJS.AES.decrypt(encryptedMessage, secret);
        return bytes.toString(CryptoJS.enc.Utf8);
    }

    @SubscribeMessage('sendPublicKey')
sendPublicKey(@MessageBody() data: { senderId: string, recipientId: string }) {
    const sender = this.users[data.senderId];
    const recipient = this.users[data.recipientId];

    // Ensure both users exist and have generated DH keys
    if (!sender || !sender.dhKeys || !recipient || !recipient.dhKeys) {
        console.log(`Public key exchange failed: One or both users are missing DH keys`);
        return;
    }

    console.log(`Exchanging public keys between ${data.senderId} and ${data.recipientId}`);

    // Sender computes shared secret using recipient's public key
    const senderDh = crypto.createDiffieHellman(2048);
    senderDh.setPrivateKey(sender.dhKeys.privateKey, 'hex');
    senderDh.setPublicKey(sender.dhKeys.publicKey, 'hex');

    // **FIXED:** Use recipient's public key from recipient's `dhKeys`
    const senderSharedSecret = senderDh.computeSecret(recipient.dhKeys.publicKey, 'hex', 'hex');
    sender.dhKeys.sharedSecret = senderSharedSecret;

    console.log(`Shared secret established for sender: ${data.senderId}`);

    // Recipient computes shared secret using sender's public key
    const recipientDh = crypto.createDiffieHellman(2048);
    recipientDh.setPrivateKey(recipient.dhKeys.privateKey, 'hex');
    recipientDh.setPublicKey(recipient.dhKeys.publicKey, 'hex');

    // **FIXED:** Use sender's public key from sender's `dhKeys`
    const recipientSharedSecret = recipientDh.computeSecret(sender.dhKeys.publicKey, 'hex', 'hex');
    recipient.dhKeys.sharedSecret = recipientSharedSecret;

    console.log(`Shared secret established for recipient: ${data.recipientId}`);

    // Send sender's public key to recipient
    recipient.sockets.forEach(socketId => {
        this.server.to(socketId).emit('receivePublicKey', { 
            senderId: data.senderId, 
            publicKey: sender.dhKeys!.publicKey
        });
    });

    // Send recipient's public key to sender
    sender.sockets.forEach(socketId => {
        this.server.to(socketId).emit('receivePublicKey', { 
            senderId: data.recipientId, 
            publicKey: recipient.dhKeys!.publicKey
        });
    });
}



    // Handle sending encrypted message
    @SubscribeMessage('sendMessage')
    handleMessage(@MessageBody() data: { senderId: string, message: string, room?: string, toUserId?: string }, @ConnectedSocket() client: Socket) {
        console.log(`Message from ${data.senderId} to ${data.room || data.toUserId}`);

        const sender = this.users[data.senderId];
        if (!sender || !sender.dhKeys?.sharedSecret) {
            console.log(`User ${data.senderId} has no shared secret`);
            client.emit('error', { message: 'Encryption error: Shared secret not established' });
            return;
        }

        // Encrypt message
        const encryptedMessage = this.encryptMessage(data.message, sender.dhKeys.sharedSecret);

        const messagePayload = {
            senderId: data.senderId,
            room: data.room,
            encryptedMessage,
        };

        // Send to all users in a room
        if (data.room) {
            this.server.to(data.room).emit('receiveMessage', messagePayload);
        }

        // Send to a specific user
        if (data.toUserId) {
            const target = this.users[data.toUserId];
            if (!target || !target.dhKeys?.sharedSecret) {
                console.log(`Target user ${data.toUserId} has no shared secret`);
                return;
            }
            target.sockets.forEach(socketId => {
                this.server.to(socketId).emit('receiveMessage', messagePayload);
            });
            const decryptedMessage = this.decryptMessage(encryptedMessage, sender.dhKeys.sharedSecret);
            client.emit('decryptedMessage', { message: decryptedMessage });
        }
    }

    // Handle receiving message and decrypting it
    @SubscribeMessage('decryptMessage')
    decryptReceivedMessage(@MessageBody() data: { userId: string, encryptedMessage: string }, @ConnectedSocket() client: Socket) {
        const user = this.users[data.userId];
        if (!user || !user.dhKeys?.sharedSecret) {
            console.log(`User ${data.userId} has no shared secret`);
            client.emit('error', { message: 'Decryption error: Shared secret not established' });
            return;
        }

        // Decrypt message
        const decryptedMessage = this.decryptMessage(data.encryptedMessage, user.dhKeys.sharedSecret);
        client.emit('decryptedMessage', { message: decryptedMessage });
    }
}

*/

/*Optimized Code (Using ECDH for Fast Key Generation)*/

/*
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as crypto from 'crypto';
import * as CryptoJS from 'crypto-js';

@WebSocketGateway({ cors: true })
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    private users: {
        [userId: string]: {
            sockets: string[],
            dhKeys?: { publicKey: string, privateKey: string, sharedSecret?: string }
        }
    } = {};

    // Handle user connection
    handleConnection(@ConnectedSocket() client: Socket) {
        console.log(`User connected: ${client.id}`);
    }

    // Handle user disconnection
    handleDisconnect(@ConnectedSocket() client: Socket) {
        console.log(`User disconnected: ${client.id}`);

        for (const userId in this.users) {
            const index = this.users[userId].sockets.indexOf(client.id);
            if (index !== -1) {
                this.users[userId].sockets.splice(index, 1);
                if (this.users[userId].sockets.length === 0) {
                    delete this.users[userId];
                }
                break;
            }
        }
    }

    // Register user and generate ECDH keys (Faster than DH)
    @SubscribeMessage('registerUser')
    registerUser(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
        if (this.users[userId]) {
            console.log(`Registration failed: User ${userId} already exists.`);
            client.emit('registrationError', { message: 'User ID already exists. Choose a different one.' });
            return;
        }

        this.users[userId] = { sockets: [client.id] };

        // **Optimized: Use ECDH instead of slow Diffie-Hellman**
        const ecdh = crypto.createECDH('secp256k1'); // Faster key generation
        const publicKey = ecdh.generateKeys('hex');
        const privateKey = ecdh.getPrivateKey('hex');

        this.users[userId].dhKeys = { publicKey, privateKey };

        console.log(`User ${userId} registered with socket ID: ${client.id}`);
        console.log('Current Users:', this.users);

        client.emit('publicKey', { userId, publicKey });
    }

    @SubscribeMessage('sendPublicKey')
    sendPublicKey(@MessageBody() data: { senderId: string, recipientId: string }) {
        const sender = this.users[data.senderId];
        const recipient = this.users[data.recipientId];

        if (!sender || !sender.dhKeys || !recipient || !recipient.dhKeys) {
            console.log(`Public key exchange failed: One or both users are missing DH keys`);
            return;
        }

        console.log(`Exchanging public keys between ${data.senderId} and ${data.recipientId}`);

        // Sender computes shared secret
        const senderEcdh = crypto.createECDH('secp256k1');
        senderEcdh.setPrivateKey(sender.dhKeys.privateKey, 'hex');
        const senderSharedSecret = senderEcdh.computeSecret(recipient.dhKeys.publicKey, 'hex', 'hex');
        sender.dhKeys.sharedSecret = senderSharedSecret;

        console.log(`Shared secret established for sender: ${data.senderId}`);

        // Recipient computes shared secret
        const recipientEcdh = crypto.createECDH('secp256k1');
        recipientEcdh.setPrivateKey(recipient.dhKeys.privateKey, 'hex');
        const recipientSharedSecret = recipientEcdh.computeSecret(sender.dhKeys.publicKey, 'hex', 'hex');
        recipient.dhKeys.sharedSecret = recipientSharedSecret;

        console.log(`Shared secret established for recipient: ${data.recipientId}`);

        // Send public keys for both users
        recipient.sockets.forEach(socketId => {
            this.server.to(socketId).emit('receivePublicKey', { senderId: data.senderId, publicKey: sender.dhKeys!.publicKey });
        });

        sender.sockets.forEach(socketId => {
            this.server.to(socketId).emit('receivePublicKey', { senderId: data.recipientId, publicKey: recipient.dhKeys!.publicKey });
        });
    }

    private encryptMessage(message: string, secret: string): string {
        return CryptoJS.AES.encrypt(message, secret).toString();
    }

    private decryptMessage(encryptedMessage: string, secret: string): string {
        const bytes = CryptoJS.AES.decrypt(encryptedMessage, secret);
        return bytes.toString(CryptoJS.enc.Utf8);
    }

    @SubscribeMessage('sendMessage')
    handleMessage(@MessageBody() data: { senderId: string, message: string, room?: string, toUserId?: string }, @ConnectedSocket() client: Socket) {
        console.log(`Message from ${data.senderId} to ${data.room || data.toUserId}`);

        const sender = this.users[data.senderId];
        if (!sender || !sender.dhKeys?.sharedSecret) {
            console.log(`User ${data.senderId} has no shared secret`);
            client.emit('error', { message: 'Encryption error: Shared secret not established' });
            return;
        }

        const encryptedMessage = this.encryptMessage(data.message, sender.dhKeys.sharedSecret);
        const decryptedMessage = this.decryptMessage(encryptedMessage, sender.dhKeys.sharedSecret);
        console.log(decryptedMessage);
        const messagePayload = { senderId: data.senderId, room: data.room, encryptedMessage, decryptedMessage };

        if (data.room) {
            this.server.to(data.room).emit('receiveMessage', messagePayload);
        }

        if (data.toUserId) {
            const target = this.users[data.toUserId];
            if (!target || !target.dhKeys?.sharedSecret) {
                console.log(`Target user ${data.toUserId} has no shared secret`);
                return;
            }
            target.sockets.forEach(socketId => {
                this.server.to(socketId).emit('receiveMessage', messagePayload);
            });


            client.emit('decryptedMessage', { senderId: data.senderId, message: decryptedMessage });
        }
    }

    @SubscribeMessage('decryptMessage')
    decryptReceivedMessage(@MessageBody() data: { userId: string, encryptedMessage: string }, @ConnectedSocket() client: Socket) {
        const user = this.users[data.userId];
        if (!user || !user.dhKeys?.sharedSecret) {
            console.log(`User ${data.userId} has no shared secret`);
            client.emit('error', { message: 'Decryption error: Shared secret not established' });
            return;
        }

        const decryptedMessage = this.decryptMessage(data.encryptedMessage, user.dhKeys.sharedSecret);
        client.emit('decryptedMessage', { message: decryptedMessage });
    }
}

*/

/* ECDH for private chat and file handling */

/*
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as crypto from 'crypto';
import * as CryptoJS from 'crypto-js';
import * as fs from 'fs';
import * as path from 'path';

@WebSocketGateway({ cors: true })
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    private users: { [userId: string]: { sockets: string[], dhKeys?: { publicKey: string, privateKey: string, sharedSecret?: string } } } = {};

    handleConnection(@ConnectedSocket() client: Socket) {
        console.log(`User connected: ${client.id}`);
    }

    handleDisconnect(@ConnectedSocket() client: Socket) {
        console.log(`User disconnected: ${client.id}`);
        for (const userId in this.users) {
            const index = this.users[userId].sockets.indexOf(client.id);
            if (index !== -1) {
                this.users[userId].sockets.splice(index, 1);
                if (this.users[userId].sockets.length === 0) {
                    delete this.users[userId];
                }
                break;
            }
        }
    }

    @SubscribeMessage('registerUser')
    registerUser(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
        if (this.users[userId]) {
            client.emit('registrationError', { message: 'User ID already exists. Choose a different one.' });
            return;
        }
        this.users[userId] = { sockets: [client.id] };
        const ecdh = crypto.createECDH('secp256k1');
        const publicKey = ecdh.generateKeys('hex');
        const privateKey = ecdh.getPrivateKey('hex');
        this.users[userId].dhKeys = { publicKey, privateKey };
        client.emit('publicKey', { userId, publicKey });
    }

    @SubscribeMessage('sendPublicKey')
    sendPublicKey(@MessageBody() data: { senderId: string, recipientId: string }) {
        const sender = this.users[data.senderId];
        const recipient = this.users[data.recipientId];
        if (!sender || !sender.dhKeys || !recipient || !recipient.dhKeys){
            console.log(`Public key exchange failed: One or both users are missing DH keys`);
            return;
        } 
        console.log(`Exchanging public keys between ${data.senderId} and ${data.recipientId}`);
        const senderEcdh = crypto.createECDH('secp256k1');
        senderEcdh.setPrivateKey(sender.dhKeys.privateKey, 'hex');
        sender.dhKeys.sharedSecret = senderEcdh.computeSecret(recipient.dhKeys.publicKey, 'hex', 'hex');
        console.log(`Shared secret established for sender: ${data.senderId}`);
        const recipientEcdh = crypto.createECDH('secp256k1');
        recipientEcdh.setPrivateKey(recipient.dhKeys.privateKey, 'hex');
        // recipient.dhKeys.sharedSecret = recipientEcdh.computeSecret(sender.dhKeys.publicKey, 'hex', 'hex');
        const recipientSharedSecret = recipientEcdh.computeSecret(sender.dhKeys.publicKey, 'hex', 'hex');
        recipient.dhKeys.sharedSecret = recipientSharedSecret;

        console.log(`Shared secret established for recipient: ${data.recipientId}`);

        // Send public keys for both users
        recipient.sockets.forEach(socketId => {
            this.server.to(socketId).emit('receivePublicKey', { senderId: data.senderId, publicKey: sender.dhKeys!.publicKey });
        });

        sender.sockets.forEach(socketId => {
            this.server.to(socketId).emit('receivePublicKey', { senderId: data.recipientId, publicKey: recipient.dhKeys!.publicKey });
        });
    }

    private encryptMessage(message: string, secret: string): string {
        return CryptoJS.AES.encrypt(message, secret).toString();
    }

    private decryptMessage(encryptedMessage: string, secret: string): string {
        return CryptoJS.AES.decrypt(encryptedMessage, secret).toString(CryptoJS.enc.Utf8);
    }

    private encryptFile(filePath: string, secret: string): { encryptedData: string, iv: string } {
        const iv = crypto.randomBytes(16).toString('hex');
        const fileBuffer = fs.readFileSync(filePath);
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), Buffer.from(iv, 'hex'));
        const encryptedData = Buffer.concat([cipher.update(fileBuffer), cipher.final()]).toString('hex');
        return { encryptedData, iv };
    }

    private decryptFile(encryptedData: string, secret: string, iv: string, outputPath: string) {
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), Buffer.from(iv, 'hex'));
        const decryptedBuffer = Buffer.concat([decipher.update(Buffer.from(encryptedData, 'hex')), decipher.final()]);
        fs.writeFileSync(outputPath, decryptedBuffer);
    }


@SubscribeMessage('sendMessage')
handleMessage(@MessageBody() data: { senderId: string, message?: string, filePath?: string, toUserId?: string }, @ConnectedSocket() client: Socket) {
    const sender = this.users[data.senderId];
    if (!sender || !sender.dhKeys?.sharedSecret) {
        client.emit('error', { message: 'Encryption error: Shared secret not established' });
        return;
    }

    let encryptedMessage: string | undefined;
    let fileMetadata: any | undefined;

    if (data.message) {
        encryptedMessage = this.encryptMessage(data.message, sender.dhKeys.sharedSecret);
    }

    if (data.filePath) {
        const { encryptedData, iv } = this.encryptFile(data.filePath, sender.dhKeys.sharedSecret);
        const fileName = path.basename(data.filePath);
        const uploadDir = path.join(__dirname, '..', '..', 'uploads');

        // Ensure the uploads directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const encryptedFilePath = path.join(uploadDir, `${fileName}.enc`);
        fs.writeFileSync(encryptedFilePath, encryptedData, 'hex');

        fileMetadata = { fileName, iv, encryptedFilePath };
    }

    if (data.toUserId) {
        const target = this.users[data.toUserId];
        if (!target || !target.dhKeys?.sharedSecret) return;

        target.sockets.forEach(socketId => {
            this.server.to(socketId).emit('receiveMessage', { senderId: data.senderId, encryptedMessage, fileMetadata });
        });
    }
}

    @SubscribeMessage('decryptMessage')
    decryptReceivedMessage(@MessageBody() data: { userId: string, encryptedMessage?: string, fileMetadata?: any }, @ConnectedSocket() client: Socket) {
        const user = this.users[data.userId];
        if (!user || !user.dhKeys?.sharedSecret) {
            client.emit('error', { message: 'Decryption error: Shared secret not established' });
            return;
        }
        let decryptedMessage: string | undefined;
        let decryptedFilePath: string | undefined;
        if (data.encryptedMessage) {
            decryptedMessage = this.decryptMessage(data.encryptedMessage, user.dhKeys.sharedSecret);
        }
        if (data.fileMetadata) {
            decryptedFilePath = `./downloads/${data.fileMetadata.fileName}`;
            this.decryptFile(fs.readFileSync(data.fileMetadata.encryptedFilePath, 'hex').toString(), user.dhKeys.sharedSecret, data.fileMetadata.iv, decryptedFilePath);
        }
        client.emit('decryptedMessage', { message: decryptedMessage, decryptedFilePath });
    }
}
*/

/* ECDH, AES GCM in msg and file data */

/*
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

@WebSocketGateway({ cors: true })
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    private users: { [userId: string]: { sockets: string[], dhKeys?: { publicKey: string, privateKey: string, sharedSecret?: string } } } = {};

    private encryptMessage(message: string, secret: string): { encryptedData: string, iv: string, authTag: string } {
        const iv = crypto.randomBytes(12); // 12 bytes IV for AES-GCM
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), iv);
        let encrypted = cipher.update(message, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return { encryptedData: encrypted, iv: iv.toString('hex'), authTag };
    }

    private decryptMessage(encryptedData: string, iv: string, authTag: string, secret: string): string {
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    private encryptFile(filePath: string, secret: string): { encryptedData: string, iv: string, authTag: string } {
        const iv = crypto.randomBytes(12); // 12 bytes IV
        const fileBuffer = fs.readFileSync(filePath);
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), iv);
        const encryptedData = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return { encryptedData: encryptedData.toString('hex'), iv: iv.toString('hex'), authTag: authTag.toString('hex') };
    }

    private decryptFile(encryptedData: string, iv: string, authTag: string, secret: string, outputPath: string) {
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        const decryptedBuffer = Buffer.concat([decipher.update(Buffer.from(encryptedData, 'hex')), decipher.final()]);
        fs.writeFileSync(outputPath, decryptedBuffer);
    }
    @SubscribeMessage('registerUser')
registerUser(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
    if (this.users[userId]) {
        // If the user already exists, just add the new socket ID
        this.users[userId].sockets.push(client.id);
    } else {
        // Create new user entry
        this.users[userId] = { sockets: [client.id] };
        const ecdh = crypto.createECDH('secp256k1');
        const publicKey = ecdh.generateKeys('hex');
        const privateKey = ecdh.getPrivateKey('hex');
        this.users[userId].dhKeys = { publicKey, privateKey };
    }
    // Send back the public key
    client.emit('publicKey', { userId, publicKey: this.users[userId].dhKeys!.publicKey });
}

    @SubscribeMessage('sendPublicKey')
    sendPublicKey(@MessageBody() data: { senderId: string, recipientId: string }) {
        const sender = this.users[data.senderId];
        const recipient = this.users[data.recipientId];
        if (!sender || !recipient) return;

        // Generate ECDH keys if not already present
        if (!sender.dhKeys) {
            const senderEcdh = crypto.createECDH('secp256k1');
            senderEcdh.generateKeys();
            sender.dhKeys = { 
                publicKey: senderEcdh.getPublicKey('hex'), 
                privateKey: senderEcdh.getPrivateKey('hex')
            };
        }
        if (!recipient.dhKeys) {
            const recipientEcdh = crypto.createECDH('secp256k1');
            recipientEcdh.generateKeys();
            recipient.dhKeys = { 
                publicKey: recipientEcdh.getPublicKey('hex'), 
                privateKey: recipientEcdh.getPrivateKey('hex')
            };
        }

        // Compute shared secret
        const senderEcdh = crypto.createECDH('secp256k1');
        senderEcdh.setPrivateKey(sender.dhKeys.privateKey, 'hex');
        sender.dhKeys.sharedSecret = senderEcdh.computeSecret(recipient.dhKeys.publicKey, 'hex', 'hex');

        const recipientEcdh = crypto.createECDH('secp256k1');
        recipientEcdh.setPrivateKey(recipient.dhKeys.privateKey, 'hex');
        recipient.dhKeys.sharedSecret = recipientEcdh.computeSecret(sender.dhKeys.publicKey, 'hex', 'hex');

        // Send public keys to both users
        sender.sockets.forEach(socketId => {
            this.server.to(socketId).emit('receivePublicKey', { userId: data.recipientId, publicKey: recipient.dhKeys!.publicKey });
        });
        recipient.sockets.forEach(socketId => {
            this.server.to(socketId).emit('receivePublicKey', { userId: data.senderId, publicKey: sender.dhKeys!.publicKey });
        });
    }
    @SubscribeMessage('sendMessage')
    handleMessage(@MessageBody() data: { senderId: string, message?: string, filePath?: string, toUserId?: string }, @ConnectedSocket() client: Socket) {
        const sender = this.users[data.senderId];
        if (!sender || !sender.dhKeys?.sharedSecret) {
            client.emit('error', { message: 'Encryption error: Shared secret not established' });
            return;
        }
    
        let encryptedMessage: any;
        let fileMetadata: any;
        let decryptedMessage: string | undefined;
        let decryptedFilePath: string | undefined;
        
        if (data.message) {
            encryptedMessage = this.encryptMessage(data.message, sender.dhKeys.sharedSecret);
            decryptedMessage = this.decryptMessage(encryptedMessage.encryptedData, encryptedMessage.iv, encryptedMessage.authTag, sender.dhKeys.sharedSecret);
        }
    
        if (data.filePath) {
            const { encryptedData, iv, authTag } = this.encryptFile(data.filePath, sender.dhKeys.sharedSecret);
            const fileName = path.basename(data.filePath);
            const uploadDir = path.join(__dirname, '..', '..', 'uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const encryptedFilePath = path.join(uploadDir, `${fileName}.enc`);
            fs.writeFileSync(encryptedFilePath, encryptedData, 'hex');
            fileMetadata = { fileName, iv, authTag, encryptedFilePath };
            
            // Decrypt for sender
            decryptedFilePath = `./downloads/${fileName}`;
            this.decryptFile(encryptedData, iv, authTag, sender.dhKeys.sharedSecret, decryptedFilePath);
        }
        
        const messagePayload = {
            senderId: data.senderId,
            encryptedMessage,
            decryptedMessage,
            fileMetadata,
            decryptedFilePath,
        };
    
        // Send message to sender
        sender.sockets.forEach(socketId => {
            this.server.to(socketId).emit('receiveMessage', messagePayload);
        });
        
        // Send message to recipient
        if (data.toUserId) {
            const target = this.users[data.toUserId];
            if (!target || !target.dhKeys?.sharedSecret) return;
            
            target.sockets.forEach(socketId => {
                this.server.to(socketId).emit('receiveMessage', messagePayload);
            });
        }
    }
    
   
}
*/

// @SubscribeMessage('sendMessage')
// handleMessage(@MessageBody() data: { senderId: string, message?: string, filePath?: string, toUserId?: string }, @ConnectedSocket() client: Socket) {
//     const sender = this.users[data.senderId];
//     if (!sender || !sender.dhKeys?.sharedSecret) {
//         client.emit('error', { message: 'Encryption error: Shared secret not established' });
//         return;
//     }

//     let encryptedMessage: any;
//     let fileMetadata: any;

//     if (data.message) {
//         encryptedMessage = this.encryptMessage(data.message, sender.dhKeys.sharedSecret);
//     }

//     if (data.filePath) {
//         const { encryptedData, iv, authTag } = this.encryptFile(data.filePath, sender.dhKeys.sharedSecret);
//         const fileName = path.basename(data.filePath);
//         const uploadDir = path.join(__dirname, '..', '..', 'uploads');
//         if (!fs.existsSync(uploadDir)) {
//             fs.mkdirSync(uploadDir, { recursive: true });
//         }
//         const encryptedFilePath = path.join(uploadDir, `${fileName}.enc`);
//         fs.writeFileSync(encryptedFilePath, encryptedData, 'hex');
//         fileMetadata = { fileName, iv, authTag, encryptedFilePath };
//     }

//     if (data.toUserId) {
//         const target = this.users[data.toUserId];
//         if (!target || !target.dhKeys?.sharedSecret) return;

//         target.sockets.forEach(socketId => {
//             this.server.to(socketId).emit('receiveMessage', { senderId: data.senderId, encryptedMessage, fileMetadata });
//         });
//     }
// }


// @SubscribeMessage('decryptMessage')
// decryptReceivedMessage(@MessageBody() data: { userId: string, encryptedMessage?: any, fileMetadata?: any }, @ConnectedSocket() client: Socket) {
//     const user = this.users[data.userId];
//     if (!user || !user.dhKeys?.sharedSecret) {
//         client.emit('error', { message: 'Decryption error: Shared secret not established' });
//         return;
//     }
    
//     let decryptedMessage: string | undefined;
//     let decryptedFilePath: string | undefined;
    
//     if (data.encryptedMessage) {
//         decryptedMessage = this.decryptMessage(data.encryptedMessage.encryptedData, data.encryptedMessage.iv, data.encryptedMessage.authTag, user.dhKeys.sharedSecret);
//     }

//     if (data.fileMetadata) {
//         decryptedFilePath = `./downloads/${data.fileMetadata.fileName}`;
//         this.decryptFile(
//             fs.readFileSync(data.fileMetadata.encryptedFilePath, 'hex').toString(),
//             data.fileMetadata.iv,
//             data.fileMetadata.authTag,
//             user.dhKeys.sharedSecret,
//             decryptedFilePath
//         );
//     }

//     client.emit('decryptedMessage', { message: decryptedMessage, decryptedFilePath });
// }

/* ECDH, AES GCM in msg and filePath data- updated code */

/*
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

@WebSocketGateway({ cors: true })
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    private users: { [userId: string]: { sockets: string[], dhKeys?: { publicKey: string, privateKey: string, sharedSecret?: string } } } = {};

    // Encrypt using AES-GCM
    private encryptData(data: string | Buffer, secret: string): { encryptedData: string, iv: string, authTag: string } {
        const iv = crypto.randomBytes(12); // 12 bytes IV for AES-GCM
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), iv);
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return { encryptedData: encrypted.toString('hex'), iv: iv.toString('hex'), authTag: authTag.toString('hex') };
    }

    // Decrypt using AES-GCM
    private decryptData(encryptedData: string, iv: string, authTag: string, secret: string): string {
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedData, 'hex')), decipher.final()]);
        return decrypted.toString();
    }

    @SubscribeMessage('registerUser')
    registerUser(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
        if (!this.users[userId]) {
            this.users[userId] = { sockets: [client.id] };
            const ecdh = crypto.createECDH('secp256k1');
            const publicKey = ecdh.generateKeys('hex');
            const privateKey = ecdh.getPrivateKey('hex');
            this.users[userId].dhKeys = { publicKey, privateKey };
        } else {
            this.users[userId].sockets.push(client.id);
        }

        client.emit('publicKey', { userId, publicKey: this.users[userId].dhKeys!.publicKey });
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

        sender.sockets.forEach(socketId => {
            this.server.to(socketId).emit('receivePublicKey', { userId: data.recipientId, publicKey: recipient.dhKeys!.publicKey });
        });

        recipient.sockets.forEach(socketId => {
            this.server.to(socketId).emit('receivePublicKey', { userId: data.senderId, publicKey: sender.dhKeys!.publicKey });
        });
    }

    @SubscribeMessage('sendMessage')
    handleMessage(@MessageBody() data: { senderId: string, message?: string, filePath?: string, toUserId?: string }, @ConnectedSocket() client: Socket) {
        const sender = this.users[data.senderId];
        if (!sender || !sender.dhKeys?.sharedSecret) {
            client.emit('error', { message: 'Encryption error: Shared secret not established' });
            return;
        }

        let encryptedMessage, decryptedMessage;
        let fileMetadata, decryptedFilePath;

        if (data.message) {
            const encrypted = this.encryptData(data.message, sender.dhKeys.sharedSecret);
            encryptedMessage = encrypted;
            decryptedMessage = this.decryptData(encrypted.encryptedData, encrypted.iv, encrypted.authTag, sender.dhKeys.sharedSecret);
        }

        if (data.filePath) {
            const { encryptedData, iv, authTag } = this.encryptData(fs.readFileSync(data.filePath), sender.dhKeys.sharedSecret);
            const fileName = path.basename(data.filePath);
            const encryptedFilePath = path.join(__dirname, '..', '..', 'uploads', `${fileName}.enc`);

            if (!fs.existsSync(path.dirname(encryptedFilePath))) {
                fs.mkdirSync(path.dirname(encryptedFilePath), { recursive: true });
            }
            fs.writeFileSync(encryptedFilePath, encryptedData, 'hex');

            fileMetadata = { fileName, iv, authTag, encryptedFilePath };

            decryptedFilePath = path.join(__dirname, '..', '..', 'downloads', fileName);

// Ensure the directory exists
if (!fs.existsSync(path.dirname(decryptedFilePath))) {
    fs.mkdirSync(path.dirname(decryptedFilePath), { recursive: true });
}

// Write the decrypted file
fs.writeFileSync(decryptedFilePath, this.decryptData(encryptedData, iv, authTag, sender.dhKeys.sharedSecret));

        }

        const messagePayload = {
            senderId: data.senderId,
            encryptedMessage,
            decryptedMessage,
            fileMetadata,
            decryptedFilePath,
        };

        // Send message to sender
        sender.sockets.forEach(socketId => {
            this.server.to(socketId).emit('receiveMessage', messagePayload);
        });

        // Send message to receiver and decrypt it
        if (data.toUserId) {
            const recipient = this.users[data.toUserId];
            if (!recipient || !recipient.dhKeys?.sharedSecret) return;

            // Decrypt for receiver
            let decryptedReceiverMessage;
            let decryptedReceiverFilePath;
            if (encryptedMessage) {
                decryptedReceiverMessage = this.decryptData(encryptedMessage.encryptedData, encryptedMessage.iv, encryptedMessage.authTag, recipient.dhKeys.sharedSecret);
            }
            if (fileMetadata) {
                decryptedReceiverFilePath = `./downloads/${fileMetadata.fileName}`;
                fs.writeFileSync(decryptedReceiverFilePath, this.decryptData(fs.readFileSync(fileMetadata.encryptedFilePath, 'hex').toString(), fileMetadata.iv, fileMetadata.authTag, recipient.dhKeys.sharedSecret));
            }

            const receiverPayload = {
                senderId: data.senderId,
                encryptedMessage,
                decryptedMessage: decryptedReceiverMessage,
                fileMetadata,
                decryptedFilePath: decryptedReceiverFilePath,
            };

            recipient.sockets.forEach(socketId => {
                this.server.to(socketId).emit('receiveMessage', receiverPayload);
            });
        }
    }
}

*/

/* ECDH, AES GCM in encrypt and decrypt message data */


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
import { Body, Controller, Post } from '@nestjs/common';
@Controller()

@WebSocketGateway({ cors: true })
export class ChatGateway {
    
   
    @WebSocketServer()
    server: Server;

    private users: { [userId: string]: { sockets: string[], dhKeys?: { publicKey: string, privateKey: string, sharedSecret?: string } } } = {};
    @Post('decryptedFilePath')
getDecryptData(@Body() data):any {
    const { userId, fileName, encryptedData, iv, authTag } = data;
    console.log('hi');
    
    if (!userId || !fileName || !encryptedData || !iv || !authTag) {
        return { error: 'Missing required fields' };
    }

    const user = this.users[userId];
    if (!user || !user.dhKeys?.sharedSecret) {
        return { error: 'Decryption error: Shared secret not established' };
    }

    const sharedSecret = user.dhKeys.sharedSecret; // Get shared secret for this user

    try {
        // Decrypt image data
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            Buffer.from(sharedSecret, 'hex'),
            Buffer.from(iv, 'hex')
        );
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        const decryptedBuffer = Buffer.concat([
            decipher.update(Buffer.from(encryptedData, 'hex')),
            decipher.final(),
        ]);

        
        // Define decrypted file path
        const decryptedFolder = path.join(__dirname, '..', 'public', 'decryptedFiles');
        if (!fs.existsSync(decryptedFolder)) {
            fs.mkdirSync(decryptedFolder, { recursive: true });
        }

        const decryptedFilePath = path.join(decryptedFolder, fileName);

        // Save decrypted image
        fs.writeFileSync(decryptedFilePath, decryptedBuffer);

        // Return the public URL of the decrypted file
        return {
            message: 'File decrypted successfully',
            fileUrl: `http://192.168.0.202:3000/public/decryptedFiles/${fileName}`,
        };
    } catch (error) {
        console.error('Decryption error:', error);
        return { error: 'Failed to decrypt the file' };
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

    // Decrypt using AES-GCM
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
            console.log("current users:",this.users);
            
        } else {
            this.users[userId].sockets.push(client.id);
        }

        client.emit('publicKey', { userId, publicKey: this.users[userId].dhKeys!.publicKey });
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

        sender.sockets.forEach(socketId => {
            this.server.to(socketId).emit('receivePublicKey', { userId: data.recipientId, publicKey: recipient.dhKeys!.publicKey });
        });

        recipient.sockets.forEach(socketId => {
            this.server.to(socketId).emit('receivePublicKey', { userId: data.senderId, publicKey: sender.dhKeys!.publicKey });
        });
    }
    @SubscribeMessage('sendMessage')
handleMessage(@MessageBody() data: { senderId: string, message?: string, filePath?: string, toUserId?: string }, @ConnectedSocket() client: Socket) {
    const sender = this.users[data.senderId];
    if (!sender || !sender.dhKeys?.sharedSecret) {
        client.emit('error', { message: 'Encryption error: Shared secret not established' });
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
            client.emit('error', { message: 'File not found' });
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

   
    @SubscribeMessage('getEncryptedFileData')
handleGetEncryptedFileData(@MessageBody() data: { userId: string, fileName: string }, @ConnectedSocket() client: Socket) {
    const user = this.users[data.userId];
    if (!user) {
        client.emit('error', { message: 'User not found' });
        return;
    }

    const encryptedFilePath = path.join(__dirname, '..', '..', 'public', 'encryptFile', `${data.fileName}.enc`);

    if (!fs.existsSync(encryptedFilePath)) {
        client.emit('error', { message: 'Encrypted file not found' });
        return;
    }

    try {
        const encryptedData = fs.readFileSync(encryptedFilePath, 'hex');
        client.emit('encryptedFileData', { fileName: data.fileName, encryptedData });
    } catch (error) {
        client.emit('error', { message: 'Failed to retrieve encrypted file data' });
    }
}

    @SubscribeMessage('decryptMessage')
    handleDecryptMessage(@MessageBody() data: { userId: string, encryptedData: string, iv: string, authTag: string }, @ConnectedSocket() client: Socket) {
    const user = this.users[data.userId];
    if (!user || !user.dhKeys?.sharedSecret) {
        client.emit('error', { message: 'Decryption error: Shared secret not established' });
        return;
    }

    try {
        const decryptedMessage = this.decryptData(data.encryptedData, data.iv, data.authTag, user.dhKeys.sharedSecret).toString();
        client.emit('decryptedMessage', { userId: data.userId, decryptedMessage });
    } catch (error) {
        client.emit('error', { message: 'Failed to decrypt message' });
    }
}

}

/* ECDH, AES GCM in encrypt and decrypt file data */

/*
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

@WebSocketGateway({ cors: true })
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    private users: { [userId: string]: { sockets: string[], dhKeys?: { publicKey: string, privateKey: string, sharedSecret?: string } } } = {};

    // Encrypt using AES-GCM
    private encryptData(data: Buffer, secret: string): { encryptedData: string, iv: string, authTag: string } {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), iv);
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return { encryptedData: encrypted.toString('hex'), iv: iv.toString('hex'), authTag: authTag.toString('hex') };
    }

    // Decrypt using AES-GCM
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
            console.log("current users:",this.users);
            
        } else {
            this.users[userId].sockets.push(client.id);
        }

        client.emit('publicKey', { userId, publicKey: this.users[userId].dhKeys!.publicKey });
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

        sender.sockets.forEach(socketId => {
            this.server.to(socketId).emit('receivePublicKey', { userId: data.recipientId, publicKey: recipient.dhKeys!.publicKey });
        });

        recipient.sockets.forEach(socketId => {
            this.server.to(socketId).emit('receivePublicKey', { userId: data.senderId, publicKey: sender.dhKeys!.publicKey });
        });
    }

    @SubscribeMessage('sendMessage')
    handleMessage(@MessageBody() data: { senderId: string, message?: string, filePath?: string, toUserId?: string }, @ConnectedSocket() client: Socket) {
        const sender = this.users[data.senderId];
        if (!sender || !sender.dhKeys?.sharedSecret) {
            client.emit('error', { message: 'Encryption error: Shared secret not established' });
            return;
        }

        let encryptedMessage, decryptedMessage;
        let fileMetadata, decryptedFileUrl;

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

            const fileBuffer = fs.readFileSync(data.filePath);
            const { encryptedData, iv, authTag } = this.encryptData(fileBuffer, sender.dhKeys.sharedSecret);
            const fileName = path.basename(data.filePath);
            const encryptDir = path.join(__dirname, '..', '..', 'public', 'encryptFile');
            const decryptDir = path.join(__dirname, '..', '..', 'public', 'decryptFile');

            if (!fs.existsSync(encryptDir)) fs.mkdirSync(encryptDir, { recursive: true });
            if (!fs.existsSync(decryptDir)) fs.mkdirSync(decryptDir, { recursive: true });

            const encryptedFilePath = path.join(encryptDir, `${fileName}.enc`);
            fs.writeFileSync(encryptedFilePath, encryptedData, 'hex');

            fileMetadata = {
                fileName,
                iv,
                authTag,
                encryptedFileUrl: `http://192.168.0.201:3000/encryptFile/${fileName}.enc`,
            };

            decryptedFileUrl = `http://192.168.0.201:3000/decryptFile/${fileName}`;
            const decryptedFilePath = path.join(decryptDir, fileName);
            fs.writeFileSync(decryptedFilePath, this.decryptData(encryptedData, iv, authTag, sender.dhKeys.sharedSecret));
        }

        const messagePayload = {
            senderId: data.senderId,
            encryptedMessage,
            decryptedMessage,
            fileMetadata,
            decryptedFileUrl,
        };

        sender.sockets.forEach(socketId => {
            this.server.to(socketId).emit('receiveMessage', messagePayload);
        });

        if (data.toUserId) {
            const recipient = this.users[data.toUserId];
            if (!recipient || !recipient.dhKeys?.sharedSecret) return;

            let decryptedReceiverMessage;
            let decryptedReceiverFileUrl;
            if (encryptedMessage) {
                decryptedReceiverMessage = this.decryptData(encryptedMessage.encryptedData, encryptedMessage.iv, encryptedMessage.authTag, recipient.dhKeys.sharedSecret).toString();
            }
            if (fileMetadata) {
                decryptedReceiverFileUrl = `http://192.168.0.201:3000/decryptFile/${fileMetadata.fileName}`;
                const decryptedFilePath = path.join(__dirname, '..', '..', 'public', 'decryptFile', fileMetadata.fileName);
                fs.writeFileSync(decryptedFilePath, this.decryptData(fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'encryptFile', `${fileMetadata.fileName}.enc`), 'hex').toString(), fileMetadata.iv, fileMetadata.authTag, recipient.dhKeys.sharedSecret));
            }

            const receiverPayload = {
                senderId: data.senderId,
                encryptedMessage,
                decryptedMessage: decryptedReceiverMessage,
                fileMetadata,
                decryptedFileUrl: decryptedReceiverFileUrl,
            };

            recipient.sockets.forEach(socketId => {
                this.server.to(socketId).emit('receiveMessage', receiverPayload);
            });
        }
    }
    @SubscribeMessage('getEncryptedFileData')
handleGetEncryptedFileData(@MessageBody() data: { userId: string, fileName: string }, @ConnectedSocket() client: Socket) {
    const user = this.users[data.userId];
    if (!user) {
        client.emit('error', { message: 'User not found' });
        return;
    }

    const encryptedFilePath = path.join(__dirname, '..', '..', 'public', 'encryptFile', `${data.fileName}.enc`);

    if (!fs.existsSync(encryptedFilePath)) {
        client.emit('error', { message: 'Encrypted file not found' });
        return;
    }

    try {
        const encryptedData = fs.readFileSync(encryptedFilePath, 'hex');
        client.emit('encryptedFileData', { fileName: data.fileName, encryptedData });
    } catch (error) {
        client.emit('error', { message: 'Failed to retrieve encrypted file data' });
    }
}


//     @SubscribeMessage('getEncryptedFileData')
// handleGetEncryptedFileData(@MessageBody() data: { userId: string, fileName: string }, @ConnectedSocket() client: Socket) {
//     const user = this.users[data.userId];
//     if (!user) {
//         client.emit('encryptedFileData', { message: 'User not found' });
//         return;
//     }

//     const encryptedFilePath = path.join(__dirname, '..', '..', 'public', 'encryptFile', `${data.fileName}.enc`);
//     const metadataFilePath = path.join(__dirname, '..', '..', 'public', 'encryptFile', `${data.fileName}.json`);

//     if (!fs.existsSync(encryptedFilePath) || !fs.existsSync(metadataFilePath)) {
//         client.emit('encryptedFileData', { message: 'Encrypted file or metadata not found' });
//         return;
//     }

//     try {
//         const encryptedData = fs.readFileSync(encryptedFilePath, 'hex');
//         const metadata = JSON.parse(fs.readFileSync(metadataFilePath, 'utf-8')); // Read metadata

//         client.emit('encryptedFileData', {
//             fileName: data.fileName,
//             encryptedData,
//             iv: metadata.iv,
//             authTag: metadata.authTag
//         });
//     } catch (error) {
//         client.emit('encryptedFileData', { message: 'Failed to retrieve encrypted file data' });
//     }
// }

@SubscribeMessage('decryptFileData')
handleDecryptFileData(@MessageBody() data: { userId: string, fileName: string, encryptedData: string, iv: string, authTag: string }, @ConnectedSocket() client: Socket) {
    const user = this.users[data.userId];
    if (!user || !user.dhKeys?.sharedSecret) {
        client.emit('error', { message: 'Decryption error: Shared secret not established' });
        return;
    }

    try {
        const decryptedBuffer = this.decryptData(data.encryptedData, data.iv, data.authTag, user.dhKeys.sharedSecret);
        
        // Save decrypted file
        const decryptDir = path.join(__dirname, '..', '..', 'public', 'decryptFile');
        if (!fs.existsSync(decryptDir)) {
            fs.mkdirSync(decryptDir, { recursive: true });
        }

        const decryptedFilePath = path.join(decryptDir, data.fileName);
        fs.writeFileSync(decryptedFilePath, decryptedBuffer);

        const decryptedFileUrl = `http://192.168.0.201:3000/decryptFile/${data.fileName}`;
        client.emit('decryptedFileData', { fileName: data.fileName, decryptedFileUrl });

    } catch (error) {
        client.emit('error', { message: 'Failed to decrypt file data' });
    }
}

}

*/

/*  file path decrypt in sendMessage listener */

/*
 @SubscribeMessage('sendMessage')
    handleMessage(@MessageBody() data: { senderId: string, message?: string, filePath?: string, toUserId?: string }, @ConnectedSocket() client: Socket) {
        const sender = this.users[data.senderId];
        if (!sender || !sender.dhKeys?.sharedSecret) {
            client.emit('error', { message: 'Encryption error: Shared secret not established' });
            return;
        }

        let encryptedMessage, decryptedMessage;
        let fileMetadata, decryptedFileUrl;

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

            const fileBuffer = fs.readFileSync(data.filePath);
            const { encryptedData, iv, authTag } = this.encryptData(fileBuffer, sender.dhKeys.sharedSecret);
            const fileName = path.basename(data.filePath);
            const encryptDir = path.join(__dirname, '..', '..', 'public', 'encryptFile');
            const decryptDir = path.join(__dirname, '..', '..', 'public', 'decryptFile');

            if (!fs.existsSync(encryptDir)) fs.mkdirSync(encryptDir, { recursive: true });
            if (!fs.existsSync(decryptDir)) fs.mkdirSync(decryptDir, { recursive: true });

            const encryptedFilePath = path.join(encryptDir, `${fileName}.enc`);
            fs.writeFileSync(encryptedFilePath, encryptedData, 'hex');

            fileMetadata = {
                fileName,
                iv,
                authTag,
                encryptedFileUrl: `http://192.168.0.202:3000/public/encryptFile/${fileName}.enc`,
            };

            decryptedFileUrl = `http://192.168.0.202:3000/public/decryptFile/${fileName}`;
            const decryptedFilePath = path.join(decryptDir, fileName);
            fs.writeFileSync(decryptedFilePath, this.decryptData(encryptedData, iv, authTag, sender.dhKeys.sharedSecret));
        }

        const messagePayload = {
            senderId: data.senderId,
            encryptedMessage,
            decryptedMessage,
            fileMetadata,
            decryptedFileUrl,
        };

        sender.sockets.forEach(socketId => {
            this.server.to(socketId).emit('receiveMessage', messagePayload);
        });

        if (data.toUserId) {
            const recipient = this.users[data.toUserId];
            if (!recipient || !recipient.dhKeys?.sharedSecret) return;

            let decryptedReceiverMessage;
            let decryptedReceiverFileUrl;
            if (encryptedMessage) {
                decryptedReceiverMessage = this.decryptData(encryptedMessage.encryptedData, encryptedMessage.iv, encryptedMessage.authTag, recipient.dhKeys.sharedSecret).toString();
            }
            if (fileMetadata) {
                decryptedReceiverFileUrl = `http://192.168.0.202:3000/public/decryptFile/${fileMetadata.fileName}`;
                const decryptedFilePath = path.join(__dirname, '..', '..', 'public', 'decryptFile', fileMetadata.fileName);
                fs.writeFileSync(decryptedFilePath, this.decryptData(fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'encryptFile', `${fileMetadata.fileName}.enc`), 'hex').toString(), fileMetadata.iv, fileMetadata.authTag, recipient.dhKeys.sharedSecret));
            }

            const receiverPayload = {
                senderId: data.senderId,
                encryptedMessage,
                decryptedMessage: decryptedReceiverMessage,
                fileMetadata,
                decryptedFileUrl: decryptedReceiverFileUrl,
            };

            recipient.sockets.forEach(socketId => {
                this.server.to(socketId).emit('receiveMessage', receiverPayload);
            });
        }
    }
*/

