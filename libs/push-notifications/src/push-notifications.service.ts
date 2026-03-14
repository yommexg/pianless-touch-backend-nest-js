import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Expo,
  ExpoPushMessage,
  ExpoPushSuccessTicket,
  ExpoPushTicket,
} from 'expo-server-sdk';
import { PrismaService } from '@app/prisma';

@Injectable()
export class PushNotificationsService {
  private expo: Expo;
  private readonly logger = new Logger(PushNotificationsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.expo = new Expo({
      accessToken: this.config.get<string>('EXPO_ACCESS_TOKEN'),
    });
  }

  async sendPushNotification(params: {
    pushTokens: string[];
    body?: string;
    data?: object;
    title?: string;
    subtitle?: string;
    sound?: 'default' | null;
    channelId?: string;
    badge?: number;
    contentAvailable?: boolean;
    icon?: string;
    imageUrl?: string;
    priority?: 'default' | 'normal' | 'high';
    interruptionLevel?: 'active' | 'critical' | 'passive' | 'time-sensitive';
    categoryId?: string;
    collapseId?: string;
    expiration?: number;
    tag?: string;
    ttl?: number;
  }): Promise<any> {
    const {
      pushTokens,
      body,
      data,
      title,
      subtitle,
      sound,
      channelId,
      badge,
      contentAvailable,
      imageUrl,
      icon,
      priority,
      interruptionLevel,
      categoryId,
      collapseId,
      expiration,
      tag,
      ttl,
    } = params;

    if (expiration !== undefined && ttl !== undefined) {
      this.logger.warn(
        'Cannot provide both "expiration" and "ttl". Please choose one.',
      );
    }

    if (pushTokens.length === 0) {
      this.logger.warn(
        'No push tokens provided to service',
        'PushNotificationsService',
      );
      return { success: false };
    }

    const messages: ExpoPushMessage[] = [];

    for (const token of pushTokens) {
      if (!Expo.isExpoPushToken(token)) {
        this.logger.error(
          `Invalid Expo push token: ${token as string}`,
          'PushNotificationsService',
        );
        continue;
      }

      messages.push({
        to: token,
        sound: sound || 'default',
        title,
        subtitle,
        body,
        icon,
        data: { ...data },
        channelId,
        _contentAvailable: contentAvailable,
        badge,
        priority: priority || 'default',
        interruptionLevel: interruptionLevel || 'active',
        mutableContent: !!imageUrl,
        richContent: imageUrl ? { image: imageUrl } : undefined,
        categoryId,
        collapseId,
        expiration,
        tag,
        ttl,
      });
    }

    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    try {
      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }
    } catch (error) {
      this.logger.error('Error sending push notifications', error);
      throw new InternalServerErrorException(
        'Failed to send push notifications',
      );
    }

    const receiptSummary = await this.handleReceipts(tickets, messages);
    this.logger.log(
      `Push Cleanup Complete: ${receiptSummary.processed} messages processed, ` +
        `${receiptSummary.removed} tokens removed, ` +
        `${receiptSummary.errors} delivery errors found.`,
      'PushNotificationsService',
    );

    return {
      success: true,
      message: 'Push notifications processed',
    };
  }

  private async handleReceipts(
    tickets: ExpoPushTicket[],
    messages: ExpoPushMessage[],
  ): Promise<{ processed: number; removed: number; errors: number }> {
    let removedCount = 0;
    let errorCount = 0;

    // 1. Handle Immediate Ticket Errors
    for (const [index, ticket] of tickets.entries()) {
      if (ticket.status === 'error') {
        errorCount++;
        if (ticket.details?.error === 'DeviceNotRegistered') {
          const token = messages[index].to;
          this.removeInvalidToken(Array.isArray(token) ? token[0] : token);
          removedCount++;
        }
      }
    }

    // 2. Handle Receipt ID Chunks
    const receiptIds = tickets
      .filter((t): t is ExpoPushSuccessTicket => t.status === 'ok')
      .map((t) => t.id);

    if (receiptIds.length === 0) {
      return {
        processed: tickets.length,
        removed: removedCount,
        errors: errorCount,
      };
    }

    const chunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);

    for (const chunk of chunks) {
      try {
        const receipts =
          await this.expo.getPushNotificationReceiptsAsync(chunk);
        for (const receiptId in receipts) {
          const receipt = receipts[receiptId];
          if (receipt.status === 'error') {
            errorCount++;
            if (receipt.details?.error === 'DeviceNotRegistered') {
              const token = receipt.details.expoPushToken;
              if (token) {
                this.removeInvalidToken(token);
                removedCount++;
              }
            }
          }
        }
      } catch (e) {
        this.logger.error('Failed to fetch some receipts', e);
      }
    }

    return {
      processed: tickets.length,
      removed: removedCount,
      errors: errorCount,
    };
  }

  private removeInvalidToken(token: string) {
    try {
      //   await this.prisma.user.updateMany({
      //     where: { pushToken: token },
      //     data: { pushToken: null },
      //   });
      this.logger.warn(`🗑️ Removed invalid push token from DB: ${token}`);
    } catch (error) {
      this.logger.error(`Failed to remove token ${token} from database`, error);
    }
  }
}
