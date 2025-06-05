import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class AttendanceUtilsService {
  /**
   * Parse composite ID format "userId:eventId"
   */
  parseCompositeId(id: string): [string, string] {
    const [userId, eventId] = id.split(':');

    if (!userId || !eventId) {
      throw new BadRequestException(
        'Invalid attendance ID format - must be "userId:eventId"',
      );
    }

    return [userId, eventId];
  }

  /**
   * Create composite ID from userId and eventId
   */
  createCompositeId(userId: string, eventId: string): string {
    if (!userId || !eventId) {
      throw new BadRequestException(
        'Both userId and eventId are required to create composite ID',
      );
    }

    return `${userId}:${eventId}`;
  }

  /**
   * Validate pagination parameters
   */
  validatePaginationParams(skip?: number, take?: number) {
    if (skip !== undefined && skip < 0) {
      throw new BadRequestException('Skip parameter cannot be negative');
    }

    if (take !== undefined) {
      if (take <= 0) {
        throw new BadRequestException('Take parameter must be greater than 0');
      }
      if (take > 1000) {
        throw new BadRequestException(
          'Take parameter cannot exceed 1000 for performance reasons',
        );
      }
    }
  }

  /**
   * Format user names for display
   */
  formatUserDisplay(user: any): string {
    if (user.fullName) {
      return user.fullName;
    }
    if (user.username) {
      return `@${user.username}`;
    }
    return user.email || 'Unknown User';
  }

  /**
   * Validate user IDs array
   */
  validateUserIds(userIds: string[]): void {
    if (!Array.isArray(userIds)) {
      throw new BadRequestException('User IDs must be an array');
    }

    if (userIds.length === 0) {
      throw new BadRequestException('At least one user ID is required');
    }

    if (userIds.length > 100) {
      throw new BadRequestException(
        'Cannot process more than 100 users at once',
      );
    }

    // Check for invalid IDs
    const invalidIds = userIds.filter((id) => !id || typeof id !== 'string');
    if (invalidIds.length > 0) {
      throw new BadRequestException('All user IDs must be valid strings');
    }

    // Check for duplicates
    const uniqueIds = new Set(userIds);
    if (uniqueIds.size !== userIds.length) {
      throw new BadRequestException('Duplicate user IDs are not allowed');
    }
  }
}
