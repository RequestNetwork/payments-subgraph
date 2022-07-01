import yargs from "yargs";
import { hideBin } from "yargs/helpers";

yargs(hideBin(process.argv))
  .commandDir("commands", { extensions: ["js", "ts"] })
  .demandCommand()
  .strict()
  .help().argv;
