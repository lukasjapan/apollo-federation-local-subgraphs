import { buildSubgraphSchema } from "@apollo/subgraph";
import { LocalGraphQLDataSource } from "@apollo/gateway";
import { readFileSync } from "fs";
import { gql } from "graphql-tag";
import { GqlPet, GqlQueryPetArgs } from "./supergraph-types";

const schema = readFileSync("./src/subgraph1.graphqls", "utf8");

const allPets = {
  1: { id: 1, type: "DOG", name: "Lucky" },
  2: { id: 2, type: "DOG", name: "Spot" },
  3: { id: 3, type: "CAT", name: "Whiskers" },
  4: { id: 4, type: "CAT", name: "Mittens" },
};

const resolvers = {
  Query: {
    subgraph1: () => "Hello from PetManager! (subgraph1)",
    pets: () => {
      console.log(new Date(), "Query.pets called");
      return Object.values(allPets);
    },
    pet: (_: undefined, input: GqlQueryPetArgs) => {
      console.log(new Date(), "Query.pet called", input);
      return allPets[input.id] || null;
    },
  },
  Pet: {
    __resolveReference: (pet: GqlPet) => {
      console.log(new Date(), "Pet.__resolveReference called", pet);
      // it is important to merge the date here to have @external data available in other resolvers
      return { ...pet, ...allPets[pet.id] };
    },
    lovedScore: (pet: GqlPet) => {
      console.log(new Date(), "Pet.lovedScore called", pet);
      return pet.pettingLog
        .map((log: any) => log.pettingDuration)
        .reduce((a: any, b: any) => a + b, 0);
    },
  },
};

const graphqlSchema = buildSubgraphSchema({ typeDefs: gql(schema), resolvers });

export const subgraph1 = new LocalGraphQLDataSource(graphqlSchema);
