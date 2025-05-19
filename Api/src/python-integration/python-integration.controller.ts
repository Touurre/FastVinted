import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { PythonIntegrationService } from "./python-integration.service";
import { CreateItemDto } from "../items/dto/create-item.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from "@nestjs/swagger";
import { PythonApiKeyGuard } from "./guards/python-api-key.guard";

@ApiTags("python-integration")
@ApiSecurity("api-key")
@UseGuards(PythonApiKeyGuard)
@Controller("python-integration")
export class PythonIntegrationController {
  constructor(
    private readonly pythonIntegrationService: PythonIntegrationService
  ) {}

  @ApiOperation({ summary: "Get all search items for Python script" })
  @ApiResponse({ status: 200, description: "Return all search items" })
  @Get("search-items")
  getSearchItems() {
    return this.pythonIntegrationService.getSearchItems();
  }
}
