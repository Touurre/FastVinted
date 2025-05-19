import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsString,
  Min,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";

export class CreateSearchItemDto {
  @ApiProperty({
    example: 50,
    description: "Maximum price for the search",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @ApiProperty({
    example: 10,
    description: "Minimum price for the search",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiProperty({
    example: ["nike", "adidas", "vintage"],
    description: "Tags for the search",
  })
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    // Si c'est déjà un tableau, on le retourne tel quel
    if (Array.isArray(value)) {
      return value;
    }
    // Si c'est une chaîne, on essaie de la parser comme JSON
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch (e) {
        // Si ce n'est pas du JSON valide, on suppose que c'est une chaîne simple
        return value;
      }
    }
    return value;
  })
  tags: string[];

  @ApiProperty({
    example: "chaussures de sport",
    description: "Search text",
  })
  @IsNotEmpty()
  @IsString()
  searchText: string;
}
