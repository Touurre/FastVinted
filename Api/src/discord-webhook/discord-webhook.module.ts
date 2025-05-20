import { Module } from '@nestjs/common';
import { DiscordWebhookController } from './discord-webhook.controller';
import { DiscordWebhookService } from './discord-webhook.service';


@Module({
    controllers: [DiscordWebhookController],
    providers: [DiscordWebhookService],
    exports: [DiscordWebhookService],
})
export class DiscordWebhookModule {}
