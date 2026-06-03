import repl from "node:repl";
import * as api from "./dist/index.js";

const r = repl.start();
Object.assign(r.context, api);
