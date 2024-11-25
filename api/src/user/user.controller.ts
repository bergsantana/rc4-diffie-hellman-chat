import { Controller, Get, Param } from '@nestjs/common'
import { Room } from '../interfaces/chat.interface'
import { UserService } from './user.service'

@Controller()
export class UserController {
  constructor(private userService: UserService) {}

  @Get('api/rooms')
  async getAllRooms(): Promise<Room[]> {
    return await this.userService.getRooms()
  }

  @Get('api/rooms/:room')
  async getRoom(@Param() params): Promise<Room> {
    console.log('Params', params)
    const rooms = await this.userService.getRooms()
    const room = await this.userService.getRoomByName(params.room, rooms)
    // console.log('salas')
    // console.log(rooms)
    // console.log('sala' )
    // console.log(room)
    return rooms[room]
  }
}
