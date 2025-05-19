import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ItemsService } from "./items.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

@ApiTags("items")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("items")
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @ApiOperation({ summary: "Get all items for current user" })
  @ApiResponse({ status: 200, description: "Return all items" })
  @Get()
  findAll(@Request() req) {
    return this.itemsService.findAll(req.user.id);
  }

  @ApiOperation({ summary: "Get items by search item id" })
  @ApiResponse({ status: 200, description: "Return items by search item id" })
  @ApiResponse({ status: 404, description: "Search item not found" })
  @Get("search/:searchItemId")
  findBySearchItem(
    @Param("searchItemId") searchItemId: string,
    @Request() req
  ) {
    return this.itemsService.findBySearchItem(searchItemId, req.user.id);
  }

  @ApiOperation({ summary: "Get item by id" })
  @ApiResponse({ status: 200, description: "Return item by id" })
  @ApiResponse({ status: 404, description: "Item not found" })
  @Get(":id")
  findOne(@Param("id") id: string, @Request() req) {
    return this.itemsService.findOne(id, req.user.id);
  }

  @ApiOperation({ summary: "Delete item by id" })
  @ApiResponse({ status: 200, description: "Item deleted successfully" })
  @ApiResponse({ status: 404, description: "Item not found" })
  @Delete(":id")
  remove(@Param("id") id: string, @Request() req) {
    return this.itemsService.remove(id, req.user.id);
  }
}
