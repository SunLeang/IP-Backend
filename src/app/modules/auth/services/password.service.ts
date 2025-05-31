import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  // Salt rounds for bcrypt hashing (higher = more secure but slower)
  private readonly saltRounds = 10;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      console.log('=== verifyPassword Debug ===');
      console.log('Plain password:', plainPassword);
      console.log('Plain password length:', plainPassword.length);
      console.log('Hashed password:', hashedPassword);
      console.log('Hashed password length:', hashedPassword.length);

      const result = await bcrypt.compare(plainPassword, hashedPassword);
      console.log('bcrypt.compare result:', result);

      return result;
    } catch (error) {
      console.error('Error in verifyPassword:', error);
      return false;
    }
  }
}
