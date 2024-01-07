/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import "reflect-metadata";
import { User } from "./mikro-orm/entities/User";
import { type IContext } from "@accounts/module-mikro-orm";
import { MikroORM, RequestContext } from "@mikro-orm/sqlite";
import { config } from "./mikro-orm/config";
import { buildSchema, createAccountsCoreModule } from "@accounts/module-core";
import { createAccountsPasswordModule } from "@accounts/module-password";
import { AccountsPassword } from "@accounts/password";
import { createApplication, gql } from "graphql-modules";
import AccountsServer, { AuthenticationServicesToken } from "@accounts/server";
import { context, createAccountsMikroORMModule } from "@accounts/module-mikro-orm";
import { createYoga } from "graphql-yoga";
import { useGraphQLModules } from "@envelop/graphql-modules";
import express from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import cors from "cors";
import accountsExpress from "@accounts/rest-express";

export interface AppContext extends IContext<User> {}
export type MyContext = AppContext & GraphQLModules.ModuleContext;

void (async () => {
  const orm = await MikroORM.init(config);
  await orm.schema.createSchema();
  const port = 4000;
  const url = `http://localhost:${port}`;

  const typeDefs = gql`
    # Our custom fields to add to the user
    extend input CreateUserInput {
      firstName: String!
      lastName: String!
    }

    extend type User {
      firstName: String!
      lastName: String!
    }
  `;

  const app = createApplication({
    modules: [
      createAccountsCoreModule({ tokenSecret: "mysecret" }),
      createAccountsPasswordModule({
        // This option is called when a new user create an account
        // Inside we can apply our logic to validate the user fields
        validateNewUser: (user) => {
          if (!user.firstName) {
            throw new Error("First name required");
          }
          if (!user.lastName) {
            throw new Error("Last name required");
          }
          return user;
        },
      }),
      createAccountsMikroORMModule({
        UserEntity: User,
        em: orm.em,
      }),
    ],
    providers: [
      {
        provide: AuthenticationServicesToken,
        useValue: { password: AccountsPassword },
        global: true,
      },
    ],
    schemaBuilder: buildSchema({ typeDefs }),
  });

  const { createOperationController } = app;

  // Create a Yoga instance with a GraphQL schema.
  const yoga = createYoga({
    plugins: [useGraphQLModules(app)],
    context: async (ctx) => await context(ctx, { createOperationController }),
  });

  const yogaRouter = express.Router();
  // GraphiQL specefic CSP configuration
  yogaRouter.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "style-src": ["'self'", "unpkg.com"],
          "script-src": ["'self'", "unpkg.com", "'unsafe-inline'"],
          "img-src": ["'self'", "raw.githubusercontent.com"],
        },
      },
    }),
  );
  yogaRouter.use(yoga);

  const router = express.Router();
  // By adding the GraphQL Yoga router before the global helmet middleware,
  // you can be sure that the global CSP configuration will not be applied to the GraphQL Yoga endpoint
  router.use(yoga.graphqlEndpoint, yogaRouter);
  // Add the global CSP configuration for the rest of your server.
  router.use(helmet());
  router.use(express.urlencoded({ extended: true }));

  const expressApp = express();
  expressApp.use(router);

  expressApp.use(bodyParser.json());
  expressApp.use(bodyParser.urlencoded({ extended: true }));
  expressApp.use(cors());

  expressApp.use((req, res, next) => {
    // calls `orm.em.fork()` and attaches it to the async context
    RequestContext.create(orm.em, next);
  });

  const controller = createOperationController({
    context: {},
  });
  // Load and expose the accounts-js middleware
  expressApp.use(accountsExpress(controller.injector.get(AccountsServer)));

  expressApp.listen(port, () => {
    console.info(`Server is running on ${url}`);
  });
})();
