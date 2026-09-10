import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/jwt-auth.guard";
import { CreateItemUseCase } from "../../application/use-cases/create-item.use-case";
import { DeleteItemUseCase } from "../../application/use-cases/delete-item.use-case";
import { ListCatalogsUseCase } from "../../application/use-cases/list-catalogs.use-case";
import { ListItemsUseCase } from "../../application/use-cases/list-items.use-case";
import { UpdateItemUseCase } from "../../application/use-cases/update-item.use-case";
import { CreateReferenceItemRequestDto } from "./dto/create-reference-item.dto";
import { UpdateReferenceItemRequestDto } from "./dto/update-reference-item.dto";
import { mapReferenceError } from "./map-reference-error";
import { toCatalogDto, toItemDto } from "./reference.presenter";

@Controller("references")
export class ReferencesController {
  constructor(
    private readonly listCatalogs: ListCatalogsUseCase,
    private readonly listItems: ListItemsUseCase,
    private readonly createItem: CreateItemUseCase,
    private readonly updateItem: UpdateItemUseCase,
    private readonly deleteItem: DeleteItemUseCase,
  ) {}

  @Get("catalogs")
  async getCatalogs() {
    try {
      const catalogs = await this.listCatalogs.execute();
      return catalogs.map(toCatalogDto);
    } catch (error) {
      mapReferenceError(error);
    }
  }

  @Get(":catalogCode/items")
  async getItems(
    @Param("catalogCode") catalogCode: string,
    @Query("activeOnly") activeOnly?: string,
  ) {
    try {
      const items = await this.listItems.execute({
        catalogCode,
        activeOnly: activeOnly === "true" || activeOnly === "1",
      });
      return items.map(toItemDto);
    } catch (error) {
      mapReferenceError(error);
    }
  }

  @Post(":catalogCode/items")
  @UseGuards(JwtAuthGuard)
  async create(
    @Param("catalogCode") catalogCode: string,
    @Body() body: CreateReferenceItemRequestDto,
  ) {
    try {
      const item = await this.createItem.execute({
        catalogCode,
        code: body.code,
        labelTh: body.labelTh,
        labelEn: body.labelEn,
        icon: body.icon,
        isActive: body.isActive,
        sortOrder: body.sortOrder,
      });
      return toItemDto(item);
    } catch (error) {
      mapReferenceError(error);
    }
  }

  @Patch("items/:id")
  @UseGuards(JwtAuthGuard)
  async update(
    @Param("id") id: string,
    @Body() body: UpdateReferenceItemRequestDto,
  ) {
    try {
      const item = await this.updateItem.execute({
        itemId: id,
        code: body.code,
        labelTh: body.labelTh,
        labelEn: body.labelEn,
        icon: body.icon,
        isActive: body.isActive,
        sortOrder: body.sortOrder,
      });
      return toItemDto(item);
    } catch (error) {
      mapReferenceError(error);
    }
  }

  @Delete("items/:id")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string) {
    try {
      await this.deleteItem.execute(id);
    } catch (error) {
      mapReferenceError(error);
    }
  }
}
