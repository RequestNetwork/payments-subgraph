import path from "path";

// reduce thegraph logs
const spinner = require("@graphprotocol/graph-cli/src/command-helpers/spinner");
spinner.step = () => {};

const Hash = require("ipfs-only-hash");
const Compiler = require("@graphprotocol/graph-cli/src/compiler");

const fakeIpfsClient = () => {
  return {
    add: async (arg: { content: any }[]) => {
      return Promise.resolve([{ hash: Hash.of(arg[0].content) }]);
    },
    pin: {
      add: () => {},
    },
  };
};

export const compile = async (subgraphManifest: string): Promise<string> => {
  // in next version of @graphprotocol
  const {
    fromFilePath,
  } = require("@graphprotocol/graph-cli/src/command-helpers/data-sources");
  const { fromDataSources } = require("@graphprotocol/graph-cli/src/protocols");

  const dataSourcesAndTemplates = await fromFilePath(subgraphManifest);
  const protocol = fromDataSources(dataSourcesAndTemplates);

  const compiler = new Compiler({
    ipfs: fakeIpfsClient(),
    subgraphManifest,
    outputDir: "./build",
    outputFormat: "wasm",
    skipMigrations: true,
    blockIpfsMethods: true,
    protocol,
  });
  return await compiler.compile();
};
