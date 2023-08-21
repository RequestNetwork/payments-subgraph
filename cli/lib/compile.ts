import Compiler from "@graphprotocol/graph-cli/dist/compiler";
import { fromFilePath } from "@graphprotocol/graph-cli/dist/command-helpers/data-sources";
import Protocol from "@graphprotocol/graph-cli/dist/protocols";

const Hash = require("ipfs-only-hash");
const fakeIpfsClient = () => {
  return {
    addAll: (arg: { content: any }[]) => {
      return {
        [Symbol.asyncIterator]() {
          return this;
        },
        async next() {
          const cid = await Hash.of(arg[0].content);
          return { value: { cid } };
        },
      };
    },
    pin: {
      add: () => {},
    },
  };
};

export const compile = async (subgraphManifest: string): Promise<string> => {
  const dataSourcesAndTemplates = await fromFilePath(subgraphManifest);
  const protocol = Protocol.fromDataSources(dataSourcesAndTemplates);

  const compiler = new Compiler({
    ipfs: fakeIpfsClient(),
    subgraphManifest,
    outputDir: "./build",
    outputFormat: "wasm",
    skipMigrations: true,
    blockIpfsMethods: ["."],
    protocol,
  });
  return await compiler.compile({ validate: true });
};
