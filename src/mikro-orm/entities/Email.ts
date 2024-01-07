import { getEmailSchema, Email as AccountsEmail } from "@accounts/mikro-orm";
import { User } from "./User";

export const EmailSchema = getEmailSchema({ UserEntity: User });

export class Email extends AccountsEmail<User> {}
