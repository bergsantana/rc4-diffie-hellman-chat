import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  Message,
  User,
} from '../interfaces/chat.interface';
import { Server, Socket } from 'socket.io';
import { UserService } from '../user/user.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private userService: UserService) {}

  @WebSocketServer() server: Server = new Server<
    ServerToClientEvents,
    ClientToServerEvents
  >();

  private logger = new Logger('ChatGateway');

  @SubscribeMessage('chat')
  async handleChatEvent(
    @MessageBody()
    payload: Message,
  ): Promise<Message> {
    this.logger.log(payload);
    this.server.to(payload.roomName).emit('chat', payload); // broadcast messages
    return payload;
  }

  @SubscribeMessage('join_room')
  async handleSetClientDataEvent(
    @MessageBody()
    payload: {
      roomName: string;
      user: User;
      sharedNumbers?: {
        base: number;
        prime: number;
        A?: number;
        B?: number;
      };
    },
  ) {
 
    if (payload.user.socketId) {
      this.logger.log(
        `${payload.user.socketId} is joining ${payload.roomName}`,
      );
      await this.server.in(payload.user.socketId).socketsJoin(payload.roomName);
      await this.userService.addUserToRoom(payload.roomName, payload.user);
    }
  }

  @SubscribeMessage('exchange')
  async handleExchange(
    @MessageBody()
    payload: {
      user: User;
      roomName: string;
      publicNumbers: { base: number; prime: number };
      df: {}   
    },
  ) {
    console.log(`Exchange key event`);
    if (payload.user.socketId) {
      this.logger.log(payload);
      const res = await this.userService.getRoomDetailByName(payload.roomName);
      // console.log('evento exchange na sala', res)
      this.server.to(payload.roomName).emit('exchange', {...payload, room: res});
      return payload;
    }
  }

  async handleConnection(socket: Socket): Promise<void> {
    this.logger.log(`Socket connected: ${socket.id}`);
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    await this.userService.removeUserFromAllRooms(socket.id);
    this.logger.log(`Socket disconnected: ${socket.id}`);
  }
}
