import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Expo,
  ExpoPushMessage,
  ExpoPushSuccessTicket,
  ExpoPushTicket,
} from 'expo-server-sdk';
import { PrismaService } from '@app/prisma';
import { ExpoPushException } from '@app/filters';
import { LoggerService } from '@app/logger';

@Injectable()
export class ExpoNotificationsService {
  private expo: Expo;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
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

    // Inside ExpoNotificationsService
    if (expiration !== undefined && ttl !== undefined) {
      throw new BadRequestException({
        message:
          'Ambiguous notification duration: Cannot provide both "expiration" and "ttl".',
        source: 'EXPO_NOTIFICATION',
      });
    }

    if (pushTokens.length === 0) {
      throw new BadRequestException({
        message:
          'Notification delivery failed: At least one valid push token must be provided.',
        source: 'EXPO_NOTIFICATION',
      });
    }

    const messages: ExpoPushMessage[] = [];

    for (const token of pushTokens) {
      if (!Expo.isExpoPushToken(token)) {
        const invalidToken = String(token);

        this.logger.warn(
          `Skipping invalid Expo push token: ${invalidToken}`,
          ExpoNotificationsService.name,
        );
        await this.removeInvalidToken(invalidToken);

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

    for (const chunk of chunks) {
      const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    const receiptSummary = await this.handleReceipts(tickets, messages);
    this.logger.log(
      `Push Cleanup Complete: ${receiptSummary.processed} messages processed, ` +
        `${receiptSummary.removed} tokens removed, ` +
        `${receiptSummary.errors} delivery errors found.`,
      ExpoNotificationsService.name,
    );

    return {
      success: true,
      message: 'Push notifications processed',
      data: receiptSummary,
    };
  }

  private async handleReceipts(
    tickets: ExpoPushTicket[],
    messages: ExpoPushMessage[],
  ): Promise<{ processed: number; removed: number; errors: number }> {
    let removedCount = 0;
    let errorCount = 0;

    for (const [index, ticket] of tickets.entries()) {
      if (ticket.status === 'error') {
        errorCount++;
        if (ticket.details?.error === 'DeviceNotRegistered') {
          const token = messages[index].to;
          await this.removeInvalidToken(
            Array.isArray(token) ? token[0] : token,
          );
          removedCount++;
        }
      }
    }

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
      const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);

      for (const receiptId in receipts) {
        const receipt = receipts[receiptId];

        if (receipt.status === 'error') {
          if (receipt.details?.error === 'DeviceNotRegistered') {
            const token = receipt.details.expoPushToken;
            if (token) {
              await this.removeInvalidToken(token);
            }
          }

          throw new ExpoPushException(receipt);
        }
      }
    }

    return {
      processed: tickets.length,
      removed: removedCount,
      errors: errorCount,
    };
  }

  private async removeInvalidToken(token: string) {
    await this.prisma.pushToken.delete({
      where: { token },
    });

    this.logger.log(
      `🗑️ Deleted invalid push token from DB: ${token}`,
      ExpoNotificationsService.name,
    );
  }
}
