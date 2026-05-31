import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly enabled: boolean;

  constructor(config: ConfigService) {
    this.enabled =
      config.get<string>('PUSH_PROVIDER') === 'firebase' &&
      Boolean(config.get<string>('FIREBASE_PROJECT_ID'));

    if (this.enabled && !getApps().length) {
      try {
        initializeApp({
          credential: applicationDefault(),
          projectId: config.get<string>('FIREBASE_PROJECT_ID'),
        });
      } catch (error) {
        this.logger.warn(
          `Firebase initialization skipped: ${(error as Error).message}`,
        );
      }
    }
  }

  async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    if (!this.enabled || !tokens.length || !getApps().length)
      return { sent: 0, skipped: tokens.length };

    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data,
    });

    return { sent: response.successCount, failed: response.failureCount };
  }
}
