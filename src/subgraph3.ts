import { ApolloServer } from "@apollo/server";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { startStandaloneServer } from "@apollo/server/standalone";
import { readFileSync } from "fs";
import { gql } from "graphql-tag";

// ---- data for subgraph3 ----
const pet = { id: 1 }; // reference to entitiy in subgraph1
const allUsers = {
  1: { id: 1, name: "Bob", favoritePet: pet },
};
const me = allUsers[1];
const allOwners = {
  1: me,
};
const allPettingLogs = [
  { id: 1, petted: pet, petter: me, timestamp: 1000, pettingDuration: 10 },
  { id: 2, petted: pet, petter: me, timestamp: 1100, pettingDuration: 20 },
];
// ---- end data for subgraph3 ----

(async () => {
  // load schema from file
  const schemaString = readFileSync("./src/subgraph3.graphqls", "utf8");
  const typeDefs = gql(schemaString);

  // build server
  const resolvers = {
    Query: {
      subgraph3: async () => "Hello from UserManager (subgraph3)",
      me: async () => {
        console.log(new Date(), "Query.me called");
        return me;
      },
    },
    User: {
      __resolveReference: (user: any) => {
        console.log(new Date(), "User.__resolveReference called", user);
        return allUsers[user.id] || null;
      },
      favoritePet: async () => {
        console.log(new Date(), "User.favoritePet  called");
        return pet;
      },
      pettingLog: async (user: any) => {
        console.log(new Date(), "User.pettingLog called", user);
        return allPettingLogs.filter((log) => log.petter.id == user.id);
      },
    },
    Pet: {
      pettingLog: async (pet: any) => {
        console.log(new Date(), "Pet.pettingLog called", pet);
        return allPettingLogs.filter((log) => log.petted.id == pet.id);
      },
      owner: async (pet: any) => {
        console.log(new Date(), "Pet.owner called", pet);
        return allOwners[pet.id] || null;
      },
    },
  };
  const schema = buildSubgraphSchema({ typeDefs, resolvers });
  const server = new ApolloServer({ schema });

  // Start the server
  const config = { listen: { port: 4003 } };
  const { url } = await startStandaloneServer(server, config);
  console.log(`🚀  Subgraph3 ready at ${url}`);
})();
