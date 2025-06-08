import { Injectable } from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { CreateVolunteerApplicationDto } from '../dto/create-volunteer-application.dto';
import { UpdateVolunteerApplicationDto } from '../dto/update-volunteer-application.dto';
import { VolunteerApplicationService } from './volunteer-application.service';
import { VolunteerCoreService } from './volunteer-core.service';
import { VolunteerQueryService } from './volunteer-query.service';


@Injectable()
export class VolunteerService {
  constructor(
    private readonly queryService: VolunteerQueryService,
    private readonly applicationService: VolunteerApplicationService,
    private readonly coreService: VolunteerCoreService,
  ) {}

  /**************************************
   * APPLICATION OPERATIONS (DELEGATED)
   **************************************/

  async createApplication(
    userId: string,
    createDto: CreateVolunteerApplicationDto,
  ) {
    return this.applicationService.createApplication(userId, createDto);
  }

  async updateApplicationStatus(
    id: string,
    updateDto: UpdateVolunteerApplicationDto,
    userId: string,
    userRole: SystemRole,
  ) {
    return this.applicationService.updateApplicationStatus(
      id,
      updateDto,
      userId,
      userRole,
    );
  }

  /**************************************
   * QUERY OPERATIONS (DELEGATED)
   **************************************/

  async getEventApplications(
    eventId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    return this.queryService.getEventApplications(eventId, userId, userRole);
  }

  async getUserApplications(userId: string) {
    return this.queryService.getUserApplications(userId);
  }

  async getApplicationById(id: string, userId: string, userRole: SystemRole) {
    return this.queryService.getApplicationById(id, userId, userRole);
  }

  async getEventVolunteers(eventId: string) {
    return this.queryService.getEventVolunteers(eventId);
  }

  async hasApprovedApplication(userId: string): Promise<boolean> {
    return this.queryService.hasApprovedApplication(userId);
  }

  /**************************************
   * CORE OPERATIONS (DELEGATED)
   **************************************/

  async removeVolunteer(
    eventId: string,
    volunteerId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    return this.coreService.removeVolunteer(
      eventId,
      volunteerId,
      userId,
      userRole,
    );
  }

  async getDashboardStats(userId: string) {
    return this.coreService.getDashboardStats(userId);
  }
}
