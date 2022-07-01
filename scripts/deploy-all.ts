import { networks } from "./networks";
import { execSync } from "child_process";
import path from "path";

for (const network of networks) {
  execSync(`${path.join(__dirname, "deploy.sh")} ${network}`, {
    stdio: "inherit",
  });
}
