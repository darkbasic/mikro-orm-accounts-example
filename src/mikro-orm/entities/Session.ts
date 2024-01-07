import { getSessionSchema, Session as AccountsSession } from "@accounts/mikro-orm";
import { User } from "./User";

export const SessionSchema = getSessionSchema({ UserEntity: User });

export class Session extends AccountsSession<User> {}
