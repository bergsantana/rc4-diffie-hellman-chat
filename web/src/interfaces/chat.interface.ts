export interface User {
  userId: string;
  userName: string;
  socketId: string;
}

export interface Room {
  name: string;
  host: User;
  users: User[];
}

export interface Message {
  user: User;
  timeSent: string;
  message: string;
  roomName: string;
  sharedNumbers?: {
    base: number
    prime: number
    closed: boolean
    A?: number
    B?: number
  }
}

export interface ServerToClientEvents {
  chat: (e: Message) => void;
  exchange: (e: any) => any;
}

export interface ClientToServerEvents {
  chat: (e: Message) => void;
  join_room: (e: { user: User; roomName: string, sharedNumbers?:{
    base: number
    prime: number
    A?: number
    B?: number
  } }) => void;
  exchange: (e : any) => any;
}
