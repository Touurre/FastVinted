import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateItemDto } from "./dto/create-item.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, limit: number, page: number, orderBy: string, order: "asc" | "desc") {
    return this.prisma.item.findMany({
      where: {
        searchItem: {
          userId,
        },
      },
      include: {
        searchItem: true,
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: {
        [orderBy]: order,
      },
    });
  }

  async findBySearchItem(searchItemId: string, userId: string, limit: number, page: number, orderBy: string, order: "asc" | "desc") {
    // Vérifier si le searchItem appartient à l'utilisateur
    const searchItem = await this.prisma.searchItem.findFirst({
      where: {
        id: searchItemId,
        userId,
      },
    });

    if (!searchItem) {
      throw new NotFoundException(
        `Search item with ID ${searchItemId} not found`
      );
    }

    return this.prisma.item.findMany({
      where: {
        searchItemId,
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: {
        [orderBy]: order,
      },
    });
  }

  async findOne(id: string, userId: string) {
    const item = await this.prisma.item.findFirst({
      where: {
        id,
        searchItem: {
          userId,
        },
      },
      include: {
        searchItem: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    return item;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.item.delete({
      where: { id },
    });
  }

  async numberOfItems(userId: string) {
    return this.prisma.item.count({
      where: {
        searchItem: {
          userId,
        },
      },
    });
  }

  async numberOfItemsPerSearch(userId: string, searchItemId: string) {
    return this.prisma.item.count({
      where: {
        searchItem: {
          id: searchItemId,
          userId,
        },
      },
    });
  }
}
