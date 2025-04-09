import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards 
} from '@nestjs/common';
import { UserService } from './user.service';
import { User as UserModel, SystemRole } from '@prisma/client';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(): Promise<UserModel[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserModel> {
    return this.userService.findOne(id);
  }

  @Post()
  async create(@Body() userData: any): Promise<UserModel> {
    // Note: In a real application, we would validate the input
    // and hash the password before storing
    return this.userService.create(userData);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: any,
  ): Promise<UserModel> {
    return this.userService.update(id, updateData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<UserModel> {
    return this.userService.softDelete(id);
  }
}