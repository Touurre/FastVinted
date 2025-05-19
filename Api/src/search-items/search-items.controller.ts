import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from "@nestjs/common";
import { SearchItemsService } from "./search-items.service";
import { CreateSearchItemDto } from "./dto/create-search-item.dto";
import { UpdateSearchItemDto } from "./dto/update-search-item.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

@ApiTags("search-items")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("search-items")
export class SearchItemsController {
  constructor(private readonly searchItemsService: SearchItemsService) {}

  @ApiOperation({ summary: "Create a new search item" })
  @ApiResponse({ status: 201, description: "Search item created successfully" })
  @Post()
  create(
    @Body() createSearchItemDto: CreateSearchItemDto,
    @Request() req: any
  ) {
    return this.searchItemsService.create(createSearchItemDto, req.user.id);
  }

  @ApiOperation({ summary: "Get all search items for current user" })
  @ApiResponse({ status: 200, description: "Return all search items" })
  @Get()
  findAll(@Request() req) {
    return this.searchItemsService.findAll(req.user.id);
  }

  @ApiOperation({ summary: "Get search item by id" })
  @ApiResponse({ status: 200, description: "Return search item by id" })
  @ApiResponse({ status: 404, description: "Search item not found" })
  @Get(":id")
  findOne(@Param("id") id: string, @Request() req) {
    return this.searchItemsService.findOne(id, req.user.id);
  }

  @ApiOperation({ summary: "Update search item by id" })
  @ApiResponse({ status: 200, description: "Search item updated successfully" })
  @ApiResponse({ status: 404, description: "Search item not found" })
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateSearchItemDto: UpdateSearchItemDto,
    @Request() req
  ) {
    return this.searchItemsService.update(id, updateSearchItemDto, req.user.id);
  }

  @ApiOperation({ summary: "Delete search item by id" })
  @ApiResponse({ status: 200, description: "Search item deleted successfully" })
  @ApiResponse({ status: 404, description: "Search item not found" })
  @Delete(":id")
  remove(@Param("id") id: string, @Request() req) {
    return this.searchItemsService.remove(id, req.user.id);
  }
}
