import { IsEmail, IsNotEmpty, MinLength } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class CreateUserDto {
  @ApiProperty({
    example: "user@example.com",
    description: "The email of the user",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({
    example: "password123",
    description: "The password of the user",
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string
}
