import { Injectable } from '@nestjs/common';
import { EventStatus, VolunteerStatus } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';

export interface VolunteerHistoryQuery {
  status?: EventStatus;
  search?: string;
}

@Injectable()
export class VolunteerHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all events the user has volunteered for
   */
  async getVolunteerHistory(userId: string, query: VolunteerHistoryQuery = {}) {
    const { status, search } = query;

    console.log('🔍 Volunteer History Query:', { userId, status, search });

    // Build where clause for events - Fix undefined issue
    const eventWhere: any = {
      deletedAt: null,
    };

    // Only add status filter if it's a valid enum value
    if (status && this.isValidEventStatus(status)) {
      eventWhere.status = status;
      console.log('✅ Valid status filter applied:', status);
    } else if (status) {
      console.log('❌ Invalid status provided, ignoring:', status);
    }

    // Only add search filter if search term is provided and not "undefined"
    if (search && search !== 'undefined' && search.trim() !== '') {
      eventWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
      console.log('✅ Search filter applied:', search);
    } else if (search && search !== 'undefined') {
      console.log('❌ Invalid search term, ignoring:', search);
    }

    console.log(
      '📝 Final event where clause:',
      JSON.stringify(eventWhere, null, 2),
    );

    try {
      // Get all volunteer records for this user with event details
      const volunteerEvents = await this.prisma.eventVolunteer.findMany({
        where: {
          userId,
          status: VolunteerStatus.APPROVED,
          event: eventWhere,
        },
        include: {
          event: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              organizer: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
              _count: {
                select: {
                  attendingUsers: true,
                  volunteers: {
                    where: {
                      status: VolunteerStatus.APPROVED,
                    },
                  },
                  tasks: true,
                },
              },
            },
          },
        },
        orderBy: {
          event: {
            dateTime: 'desc', // Most recent events first
          },
        },
      });

      console.log(
        `✅ Found ${volunteerEvents.length} volunteer events for user`,
      );

      // Transform data and calculate metadata
      const events = volunteerEvents.map((ve) => ({
        id: ve.event.id,
        name: ve.event.name,
        description: ve.event.description,
        dateTime: ve.event.dateTime,
        locationDesc: ve.event.locationDesc,
        locationImage: ve.event.locationImage,
        profileImage: ve.event.profileImage,
        coverImage: ve.event.coverImage,
        status: ve.event.status,
        volunteerStatus: ve.status,
        approvedAt: ve.approvedAt,
        category: ve.event.category,
        organizer: ve.event.organizer,
        _count: ve.event._count,
      }));

      // Calculate summary statistics
      const total = events.length;
      const completed = events.filter(
        (e) => e.status === EventStatus.COMPLETED,
      ).length;
      const upcoming = events.filter(
        (e) =>
          e.status === EventStatus.PUBLISHED &&
          new Date(e.dateTime) > new Date(),
      ).length;
      const cancelled = events.filter(
        (e) => e.status === EventStatus.CANCELLED,
      ).length;

      const result = {
        data: events,
        meta: {
          total,
          completed,
          upcoming,
          cancelled,
        },
      };

      console.log('📊 Volunteer history result:', {
        total,
        completed,
        upcoming,
        cancelled,
      });

      return result;
    } catch (error) {
      console.error('❌ Error in getVolunteerHistory:', error);
      throw error;
    }
  }

  /**
   * Get single event detail for volunteer history
   */
  async getVolunteerEventDetail(userId: string, eventId: string) {
    console.log('🔍 Getting volunteer event detail:', { userId, eventId });

    try {
      // Check if user is a volunteer for this event
      const volunteerEvent = await this.prisma.eventVolunteer.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
          status: VolunteerStatus.APPROVED,
        },
        include: {
          event: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              organizer: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
              _count: {
                select: {
                  attendingUsers: true,
                  volunteers: {
                    where: {
                      status: VolunteerStatus.APPROVED,
                    },
                  },
                  tasks: true,
                },
              },
            },
          },
        },
      });

      if (!volunteerEvent || !volunteerEvent.event) {
        console.log('❌ Volunteer event not found or user not authorized');
        return null;
      }

      // Additional check to ensure event is not deleted
      if (volunteerEvent.event.deletedAt) {
        console.log('❌ Event has been deleted');
        return null;
      }

      console.log('✅ Found volunteer event detail');

      // Transform the data
      const eventDetail = {
        id: volunteerEvent.event.id,
        name: volunteerEvent.event.name,
        description: volunteerEvent.event.description,
        dateTime: volunteerEvent.event.dateTime,
        locationDesc: volunteerEvent.event.locationDesc,
        locationImage: volunteerEvent.event.locationImage,
        profileImage: volunteerEvent.event.profileImage,
        coverImage: volunteerEvent.event.coverImage,
        status: volunteerEvent.event.status,
        volunteerStatus: volunteerEvent.status,
        approvedAt: volunteerEvent.approvedAt,
        category: volunteerEvent.event.category,
        organizer: volunteerEvent.event.organizer,
        _count: volunteerEvent.event._count,
      };

      return eventDetail;
    } catch (error) {
      console.error('❌ Error in getVolunteerEventDetail:', error);
      throw error;
    }
  }

  /**
   * Validate if status is a valid EventStatus enum
   */
  private isValidEventStatus(status: any): status is EventStatus {
    return Object.values(EventStatus).includes(status);
  }
}
