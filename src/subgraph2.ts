import { buildSubgraphSchema } from "@apollo/subgraph";
import { LocalGraphQLDataSource } from "@apollo/gateway";
import { readFileSync } from "fs";
import { gql } from "graphql-tag";

const schema = readFileSync("./src/subgraph2.graphqls", "utf8");

const resolvers = {
  Query: {
    subgraph2: () => "Hello from the PetStore! (subgraph2)",
    petstores: () => {
      console.log(new Date(), "Query.petstores called");
      return [
        { id: 1, name: "Petstore 1", pets: [{ id: 1 }, { id: 3 }] },
        { id: 2, name: "Petstore 2", pets: [{ id: 4 }] },
      ];
    },
  },
  Pet: {
    price: (pet: any) => {
      console.log(new Date(), "Pet.price called", pet);
      return (pet.type === "DOG" ? 200 : 100) * pet.name.length;
    },
  },
};

const graphqlSchema = buildSubgraphSchema({ typeDefs: gql(schema), resolvers });

export const subgraph2 = new LocalGraphQLDataSource(graphqlSchema);
