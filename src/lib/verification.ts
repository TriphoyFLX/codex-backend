import prisma from './prisma';
import emailService from './email';

export class VerificationService {
  // Generate 6-digit verification code
  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create and send verification code
  async createAndSendVerification(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if there's already a recent verification code
      const existingVerification = await prisma.emailVerification.findFirst({
        where: {
          email,
          expires_at: {
            gt: new Date()
          }
        }
      });

      if (existingVerification) {
        const timeDiff = existingVerification.expires_at.getTime() - Date.now();
        const minutesRemaining = Math.ceil(timeDiff / (1000 * 60));
        
        return {
          success: false,
          error: `Код уже был отправлен. Попробуйте через ${minutesRemaining} минут.`
        };
      }

      // Generate new code
      const code = this.generateCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Code expires in 10 minutes

      // Save to database
      await prisma.emailVerification.upsert({
        where: { email },
        update: {
          code,
          expires_at: expiresAt,
          created_at: new Date()
        },
        create: {
          email,
          code,
          expires_at: expiresAt
        }
      });

      // Send email
      const emailSent = await emailService.sendVerificationCode(email, code);
      
      if (!emailSent) {
        return {
          success: false,
          error: 'Не удалось отправить код подтверждения. Попробуйте позже.'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating verification:', error);
      return {
        success: false,
        error: 'Произошла ошибка при создании кода подтверждения.'
      };
    }
  }

  // Verify code
  async verifyCode(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const verification = await prisma.emailVerification.findUnique({
        where: { email }
      });

      if (!verification) {
        return {
          success: false,
          error: 'Код подтверждения не найден. Запросите новый код.'
        };
      }

      // Check if code is expired
      if (verification.expires_at < new Date()) {
        // Clean up expired verification
        await prisma.emailVerification.delete({
          where: { email }
        });
        
        return {
          success: false,
          error: 'Срок действия кода истек. Запросите новый код.'
        };
      }

      // Check if code matches
      if (verification.code !== code) {
        return {
          success: false,
          error: 'Неверный код подтверждения.'
        };
      }

      // Clean up verification after successful verification
      await prisma.emailVerification.delete({
        where: { email }
      });

      return { success: true };
    } catch (error) {
      console.error('Error verifying code:', error);
      return {
        success: false,
        error: 'Произошла ошибка при проверке кода.'
      };
    }
  }

  // Clean up expired verifications (can be called periodically)
  async cleanupExpiredVerifications(): Promise<void> {
    try {
      await prisma.emailVerification.deleteMany({
        where: {
          expires_at: {
            lt: new Date()
          }
        }
      });
      console.log('Cleaned up expired email verifications');
    } catch (error) {
      console.error('Error cleaning up expired verifications:', error);
    }
  }
}

export default new VerificationService();
