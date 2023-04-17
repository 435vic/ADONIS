import url from "url";
import path from "path";

export const filename = () => url.fileURLToPath(import.meta.url)
export const dirname = () => path.dirname(filename())
