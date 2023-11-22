import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloGateway, RemoteGraphQLDataSource } from "@apollo/gateway";
import { readFileSync } from "fs";
import express, { Response } from "express";
import cors from "cors";
import { subgraph1 } from "./subgraph1";
import { subgraph2 } from "./subgraph2";
import {
  GqlExampleQueryQuery,
  GqlExampleQueryQueryVariables,
} from "./supergraph-types";
import { render } from "mustache";

(async () => {
  // internal graphql server
  const gateway = new ApolloGateway({
    supergraphSdl: readFileSync("./src/supergraph.graphqls", "utf8"),
    buildService: ({ url }) => {
      if (url === "http://subgraph1") {
        return subgraph1;
      } else if (url === "http://subgraph2") {
        return subgraph2;
      } else {
        return new RemoteGraphQLDataSource({ url });
      }
    },
  });
  const server = new ApolloServer({ gateway });
  await server.start();

  // http server
  const app = express();
  if (!process.env.HIDE_GRAPHQL_ENDPOINT) {
    app.use("/graphql", cors(), express.json(), expressMiddleware(server));
  }

  app.get("/", async (_, res: Response) => {
    const query = readFileSync("./src/examplequery.graphql", "utf8");
    const result = await server.executeOperation<
      GqlExampleQueryQuery,
      GqlExampleQueryQueryVariables
    >({ query });
    if (result.body.kind === "single" && !result.body.singleResult.errors) {
      const template = readFileSync("./src/example.html", "utf8");
      const html = render(template, result.body.singleResult.data);
      res.send(html);
    } else {
      throw new Error("Not supported");
    }
  });

  app.listen(80, () => {
    console.log(`Server running on http://localhost/`);
  });
})();
