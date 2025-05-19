import { PartialType } from "@nestjs/swagger"
import { CreateSearchItemDto } from "./create-search-item.dto"

export class UpdateSearchItemDto extends PartialType(CreateSearchItemDto) {}
