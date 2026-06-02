import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * PUSH NOTIFICATIONS
   * Expects Firebase Admin SDK setup via environment variables
   */
  async sendPushNotification(userId: string, title: string, body: string, data?: any) {
    // 1. Fetch user devices
    const devices = await this.prisma.pushDevice.findMany({ where: { userId } });
    if (!devices.length) return false;

    const tokens = devices.map(d => d.token);
    
    // TODO: Await actual API Key for Firebase Admin injection
    // const message = { notification: { title, body }, data, tokens };
    // await firebaseAdmin.messaging().sendMulticast(message);

    console.log(`[PUSH NOTIFICATION MOCK] Sent to ${tokens.length} devices for User ${userId}: ${title} - ${body}`);
    return true;
  }

  /**
   * SMS NOTIFICATIONS
   * Expects Twilio or local Afghan Gateway (AWCC/Roshan)
   */
  async sendSMS(phone: string, message: string) {
    // TODO: Await actual API Key for Twilio / Local Gateway injection
    // await twilioClient.messages.create({ body: message, from: process.env.TWILIO_NUMBER, to: phone });

    console.log(`[SMS NOTIFICATION MOCK] Sent to ${phone}: ${message}`);
    return true;
  }

  /**
   * IN-APP NOTIFICATIONS
   */
  async createInAppNotification(userId: string, title: string, message: string, type: any) {
    return this.prisma.notification.create({
      data: {
        userId,
        title,
        body: message,
      }
    });
  }
}
