import { Injectable } from '@nestjs/common';
import { EventService } from './event.service';
import { EventPermissionService } from './event-permission.service';
import { EventQueryService } from './event-query.service';
import { EventStatus, SystemRole } from '@prisma/client';

@Injectable()
export class EventAdminService {
  constructor(
    private readonly eventService: EventService,
    private readonly eventPermissionService: EventPermissionService,
    private readonly eventQueryService: EventQueryService,
  ) {}

  /**************************************
   * ADMIN PERMISSION-AWARE OPERATIONS
   **************************************/
  
  // Update event only with admin permissions
  async updateWithPermissions(
    id: string,
    updateEventDto: any,
    userId: string,
    userRole: SystemRole,
  ) {
    // Check event if exists
    const event = await this.eventService.findEventOrThrow(id);
    // Validate user permissions for updating the event
    this.eventPermissionService.validateEventUpdate(event, userId, userRole);
    return this.eventService.updateBasic(id, updateEventDto);
  }

  // Remove event only with admin permissions
  async removeWithPermissions(
    id: string,
    userId: string,
    userRole: SystemRole,
  ) {
    const event = await this.eventService.findEventOrThrow(id);
    this.eventPermissionService.validateEventDelete(event, userId, userRole);
    return this.eventService.softDelete(id);
  }

  async updateStatusWithPermissions(
    id: string,
    status: EventStatus,
    userId: string,
    userRole: SystemRole,
  ) {
    const event = await this.eventService.findEventOrThrow(id);
    this.eventPermissionService.validateEventStatusUpdate(event, userId, userRole);
    return this.eventService.updateStatus(id, status);
  }

  async toggleVolunteerApplicationsWithPermissions(
    id: string,
    acceptingVolunteers: boolean,
    userId: string,
    userRole: SystemRole,
  ) {
    const event = await this.eventService.findEventOrThrow(id);
    this.eventPermissionService.validateVolunteerToggle(event, userId, userRole);
    return this.eventService.toggleVolunteerAcceptance(id, acceptingVolunteers);
  }

  /**************************************
   * ADMIN DATA ACCESS METHODS
   **************************************/

  async getEventAttendees(id: string) {
    await this.eventService.findEventOrThrow(id);
    return this.eventQueryService.getEventAttendees(id);
  }

  async getEventVolunteers(id: string) {
    await this.eventService.findEventOrThrow(id);
    return this.eventQueryService.getEventVolunteers(id);
  }
}