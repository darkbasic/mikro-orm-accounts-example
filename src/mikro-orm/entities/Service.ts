import { getServiceSchema, Service as AccountsService } from "@accounts/mikro-orm";
import { User } from "./User";

export const ServiceSchema = getServiceSchema({ UserEntity: User });

export class Service extends AccountsService<User> {}
