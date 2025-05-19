import { IsNotEmpty, IsString, IsNumber, IsUrl } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class CreateItemDto {
  @ApiProperty({
    example: "https://example.com/image.jpg",
    description: "URL of the item image",
  })
  @IsNotEmpty()
  @IsUrl()
  imageUrl: string

  @ApiProperty({
    example: "Nike Air Max",
    description: "Name of the item",
  })
  @IsNotEmpty()
  @IsString()
  name: string

  @ApiProperty({
    example: "Neuf avec étiquette",
    description: "Condition of the item",
  })
  @IsNotEmpty()
  @IsString()
  condition: string

  @ApiProperty({
    example: "M",
    description: "Size of the item",
  })
  @IsNotEmpty()
  @IsString()
  size: string

  @ApiProperty({
    example: 50,
    description: "Price of the item",
  })
  @IsNotEmpty()
  @IsNumber()
  price: number

  @ApiProperty({
    example: "JohnDoe",
    description: "Name of the seller",
  })
  @IsNotEmpty()
  @IsString()
  sellerName: string

  @ApiProperty({
    example: "https://www.vinted.fr/items/123456",
    description: "URL of the item on Vinted",
  })
  @IsNotEmpty()
  @IsUrl()
  url: string

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "ID of the search item",
  })
  @IsNotEmpty()
  @IsString()
  searchItemId: string
}
