import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateSearchItemDto } from "./dto/create-search-item.dto";
import { UpdateSearchItemDto } from "./dto/update-search-item.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class SearchItemsService {
  constructor(private prisma: PrismaService) {}

  async create(createSearchItemDto: CreateSearchItemDto, userId: string) {
    // Convertir le tableau de tags en chaîne délimitée par des virgules
    const tagsString = Array.isArray(createSearchItemDto.tags)
      ? createSearchItemDto.tags.join(",")
      : createSearchItemDto.tags;

    return this.prisma.searchItem.create({
      data: {
        maxPrice: createSearchItemDto.maxPrice,
        minPrice: createSearchItemDto.minPrice,
        tags: tagsString,
        searchText: createSearchItemDto.searchText,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    const searchItems = await this.prisma.searchItem.findMany({
      where: { userId },
      include: {
        items: true,
      },
    });

    // Convertir la chaîne de tags en tableau pour chaque searchItem
    return searchItems.map((item) => ({
      ...item,
      tags: item.tags ? item.tags.split(",") : [],
    }));
  }

  async findOne(id: string, userId: string) {
    const searchItem = await this.prisma.searchItem.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        items: true,
      },
    });

    if (!searchItem) {
      throw new NotFoundException(`Search item with ID ${id} not found`);
    }

    // Convertir la chaîne de tags en tableau
    return {
      ...searchItem,
      tags: searchItem.tags ? searchItem.tags.split(",") : [],
    };
  }

  async update(
    id: string,
    updateSearchItemDto: UpdateSearchItemDto,
    userId: string
  ) {
    await this.findOne(id, userId);

    // Préparer les données à mettre à jour
    const dataToUpdate: any = { ...updateSearchItemDto };

    // Si tags est présent et est un tableau, le convertir en chaîne
    if (updateSearchItemDto.tags && Array.isArray(updateSearchItemDto.tags)) {
      dataToUpdate.tags = updateSearchItemDto.tags.join(",");
    }

    const updatedItem = await this.prisma.searchItem.update({
      where: { id },
      data: dataToUpdate,
    });

    // Convertir la chaîne de tags en tableau pour le résultat
    return {
      ...updatedItem,
      tags: updatedItem.tags ? updatedItem.tags.split(",") : [],
    };
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.searchItem.delete({
      where: { id },
    });
  }
}
