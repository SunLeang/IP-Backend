import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/app/prisma/services/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@Injectable()
export class AssignmentService {
  constructor(private prisma: PrismaService) {}

  async assignTask(dto: CreateAssignmentDto) {
    return this.prisma.taskAssignment.create({
      data: {
        task: { connect: { id: dto.taskId } },
        volunteer: { connect: { id: dto.volunteerId } },
        assignedBy: { connect: { id: dto.assignedById } },
        ...(dto.status && { status: dto.status }),
      },
      include: {
        task: true,
        volunteer: true,
        assignedBy: true,
      },
    });
  }

  async getAllAssignments() {
    return this.prisma.taskAssignment.findMany({
      include: {
        task: true,
        volunteer: true,
        assignedBy: true,
      },
    });
  }

  async getAssignmentsByVolunteer(volunteerId: string) {
    return this.prisma.taskAssignment.findMany({
      where: { volunteerId },
      include: {
        task: true,
        assignedBy: true,
      },
    });
  }

  async getAssignmentsByTask(taskId: string) {
    return this.prisma.taskAssignment.findMany({
      where: { taskId },
      include: {
        volunteer: true,
        assignedBy: true,
      },
    });
  }

  async deleteAssignment(id: string) {
    return this.prisma.taskAssignment.delete({ where: { id } });
  }
}
