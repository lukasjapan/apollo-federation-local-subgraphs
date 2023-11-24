# An Example of Apollo Federation with Local Subgraphs in a Single Node Process

A simple example of a federated PetStore in TypeScript, all in a single node process.

## Subgraphs and the Supergraph

Given are the following "subgraph"s, which manage their own data and concerns:

| Name      | Type     | Objective                   |
| --------- | -------- | --------------------------- |
| subgraph1 | local    | Manage existing pets        |
| subgraph2 | local    | Manage pet stores           |
| subgraph3 | external | Manage users who have a pet |

Subgraphs are GraphQL graphs with [custom directives](https://www.apollographql.com/docs/apollo-server/schema/directives/#custom-directives) defined by the [Apollo Federation](https://www.apollographql.com/docs/federation/) project.
These graphs can be joined into a single "supergraph". The supergraph is a new GraphQL schema that includes all types and fields from the subgraphs, joined by rules given by the custom federation directives.

In this example, subgraph1 and subgraph2 are managed and developed locally, while subgraph3 represents an external subgraph, out of the scope of our development process.

## How Does the Code in this Repository Work?

Before running any other code, we need to start `subgraph3` first.

```bash
npm run subgraph3
```

It was added to this repository for simplicity. But let's assume it is hosted somewhere else and is always available.

### Generating the Supergraph

With Apollo's [`rover cli`](https://www.apollographql.com/docs/rover/), we can compose all subgraph schemas into the supergraph, which is represented by a [single schema file](./src/supergraph.graphqls). We specify the subgraphs by a [configuration file](supergraph.yml). Note that we have to provide a `routing_url` for each subgraph and we will use an arbitrary value for the local graphs. The URLs will be used to implement internal routing later. The generated supergraph schema file should be shipped with the application because [composing on the fly is against best practices](https://www.apollographql.com/docs/federation/quickstart/setup/#supergraph-schema-composition).

We do this by using the `develop-schema` script from [package.json](package.json). This script will watch for changes on all local schema files and update the supergraph schema file in real time. Note that this will not be able to react to changes from the remote schema (not supported in `rover cli`), but we can simply rerun the script if required.

```bash
npm run compose-supergraph # one time composition
npm run develop-supergraph # watch for changes in local schema and compose
```

### Types

Type definitions for typescript can be generated automatically with [graphql-codegen](https://the-guild.dev/graphql/codegen).
We can instruct graphql-codegen to watch the supergraph schema file and dump the type definitions on changes.

Ref.: [codegen.yml](codegen.yml)

```bash
npm run codegen # one time generation of type definitions
npm run develop-codegen # watch for changes and generate type definitions
```

### Running the Gateway

The [Apollo Router / Gateway](https://www.apollographql.com/docs/federation/building-supergraphs/router) will process GraphQL requests against the supergraph. Since actual data fetching and resolving logic lies within the subgraphs, the router will just generate and forward appropriate requests from the original request. The target subgraph endpoints (routing URLs) are embedded within the supergraph schema as custom directives, so the router knows which endpoints needs to be accessed.

We will not use the precompiled binary but the javascript library for routing. With the library, we can route to subgraph1 and subgraph2 internally without further REST requests. Internal routing is achieved by providing the `buildService` configuration option, checking against the routing URLs, and returning a `LocalGraphQLDataSource` instance if we encounter one of our previously defined arbitrary URLs. This will tell the library to execute locally defined resolvers.

Ref.: [/src/supergraph.ts](/src/supergraph.ts)

```bash
npm develop-supergraph # run the supergraph and watch for changes in .ts files
```

### Using the Graph "Backend for Frontend" style

Sometimes, the graph is intended for internal use only. We can also choose not to expose the graph as a REST endpoint but send requests to the gateway server directly by calling `executeOperation` (and avoid network overhead).
The code in this repository provides a simple example with [express](https://expressjs.com/) to run a query against the graph and then use the result to render a template.

Ref.: [/src/supergraph.ts](/src/supergraph.ts)

Note: With this example code, we can set the environment variable `HIDE_GRAPHQL_ENDPOINT` to not expose the graph at [http://localhost/graphql](http://localhost/graphql).

### Develop and Deploy

For the sake of completeness, [package.json](package.json) provides a script to ease development:

```bash
npm start # run all development scripts at once
```

This will run the watch processes described in the above sections.

If development is complete, we can generate something shippable by running:

```bash
npm run compose-supergraph
npm run codegen
npm run build
```

And then run with:

```bash
npm run serve
# or
HIDE_GRAPHQL_ENDPOINT=1 npm run serve
```
