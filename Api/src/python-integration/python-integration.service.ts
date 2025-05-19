import { Injectable, Logger } from "@nestjs/common";
import { ItemsService } from "../items/items.service";
import { SearchItemsService } from "../search-items/search-items.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateItemDto } from "../items/dto/create-item.dto";

@Injectable()
export class PythonIntegrationService {
  private readonly logger = new Logger(PythonIntegrationService.name);

  constructor(
    private itemsService: ItemsService,
    private searchItemsService: SearchItemsService,
    private prisma: PrismaService
  ) {}

  async getSearchItems() {
    const searchItems = await this.prisma.searchItem.findMany();

    return searchItems.map((item) => ({
      ...item,
      tags: item.tags ? item.tags.split(",") : [],
    }));
  }
}
