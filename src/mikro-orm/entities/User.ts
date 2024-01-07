import { Entity, Property } from "@mikro-orm/sqlite";
import {
  type UserCtorArgs as AccountsUserCtorArgs,
  type Email,
  type Session,
  type Service,
  type UserCtor,
  getUserCtor,
  getUserSchema,
} from "@accounts/mikro-orm";

interface UserCtorArgs extends AccountsUserCtorArgs {
  id?: number;
  createdAt?: Date;
  firstName: string;
  lastName: string;
}

export const AccountsUser: UserCtor<Email<User>, Session<User>, Service<User>> = getUserCtor<
  Email<User>,
  Session<User>,
  Service<User>
>({
  abstract: true,
});

export const AccountsUserSchema = getUserSchema({ AccountsUser, abstract: true });

@Entity()
export class User extends AccountsUser {
  @Property()
  firstName: string;

  @Property()
  lastName: string;

  constructor({ id, createdAt, firstName, lastName, ...otherProps }: UserCtorArgs) {
    super(otherProps);
    if (id != null) {
      this.id = id;
    }
    if (createdAt != null) {
      this.createdAt = createdAt;
    }
    this.firstName = firstName;
    this.lastName = lastName;
  }
}
