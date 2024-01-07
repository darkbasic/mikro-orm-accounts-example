import { type Options } from "@mikro-orm/sqlite";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import entities from "./entities";

export const config: Options = {
  entities,
  metadataProvider: TsMorphMetadataProvider,
  dbName: ":memory:",
  debug: false,
};
