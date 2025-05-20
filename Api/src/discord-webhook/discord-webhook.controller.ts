import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Post,
  Body,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { DiscordWebhookService } from "./discord-webhook.service";

@ApiTags("discord-webhook")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("discord-webhook")
export class DiscordWebhookController {
  constructor(private readonly discordWebhookService: DiscordWebhookService) {}

  @ApiOperation({ summary: "Get all items for current user" })
  @ApiResponse({ status: 200, description: "Return all items" })
  @Post()
  modify(
    @Request() req,
    @Body("url") url: string,
  ) {
    return this.discordWebhookService.modify(req.user.id, url);
  }

  @ApiOperation({ summary: "Get a webhook" })
  @ApiResponse({ status: 200, description: "Return a webhook" })
  @ApiResponse({ status: 404, description: "Webhook not found" })
  @Get()
  getOne(@Request() req) {
    return this.discordWebhookService.findOne(req.user.id);
  }
}
