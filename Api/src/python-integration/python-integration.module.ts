import { Module } from "@nestjs/common";
import { PythonIntegrationService } from "./python-integration.service";
import { PythonIntegrationController } from "./python-integration.controller";
import { ItemsModule } from "../items/items.module";
import { SearchItemsModule } from "../search-items/search-items.module";

@Module({
  imports: [ItemsModule, SearchItemsModule],
  providers: [PythonIntegrationService],
  controllers: [PythonIntegrationController],
})
export class PythonIntegrationModule {}
