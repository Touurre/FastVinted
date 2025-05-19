import { Module } from "@nestjs/common";
import { SearchItemsService } from "./search-items.service";
import { SearchItemsController } from "./search-items.controller";

@Module({
  providers: [SearchItemsService],
  controllers: [SearchItemsController],
  exports: [SearchItemsService],
})
export class SearchItemsModule {}
