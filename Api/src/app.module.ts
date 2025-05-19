import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { AuthModule } from "./auth/auth.module"
import { UsersModule } from "./users/users.module"
import { SearchItemsModule } from "./search-items/search-items.module"
import { ItemsModule } from "./items/items.module"
import { PythonIntegrationModule } from "./python-integration/python-integration.module"
import { PrismaModule } from "./prisma/prisma.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SearchItemsModule,
    ItemsModule,
    PythonIntegrationModule,
  ],
})
export class AppModule {}
