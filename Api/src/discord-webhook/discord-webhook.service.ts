import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class DiscordWebhookService {
  constructor(private prisma: PrismaService) {}

  async modify(userId: string, url: string) {
    const webhook = await this.prisma.discordWebhook.findUnique({
      where: {
        userId,
      },
    });

    if (!webhook) {
      return this.prisma.discordWebhook.create({
        data: {
          url,
          userId,
        },
      });
    }

    return this.prisma.discordWebhook.update({
      where: {
        userId
      },
      data: {
        url,
      },
    });
  }

  async findOne(userId: string) {
    return this.prisma.discordWebhook.findUnique({
      where: {
        userId,
      },
    });
  }
}
