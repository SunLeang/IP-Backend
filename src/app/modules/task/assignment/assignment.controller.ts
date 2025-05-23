import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@Controller('assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  async assign(@Body() dto: CreateAssignmentDto) {
    return this.assignmentService.assignTask(dto);
  }

  @Get()
  async findAll() {
    return this.assignmentService.getAllAssignments();
  }

  @Get('volunteer/:volunteerId')
  async findByVolunteer(@Param('volunteerId') volunteerId: string) {
    return this.assignmentService.getAssignmentsByVolunteer(volunteerId);
  }

  @Get('task/:taskId')
  async findByTask(@Param('taskId') taskId: string) {
    return this.assignmentService.getAssignmentsByTask(taskId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.assignmentService.deleteAssignment(id);
  }
}
