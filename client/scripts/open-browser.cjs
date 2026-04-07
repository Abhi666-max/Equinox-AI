/* Opens the Equinox AI frontend in the default browser (Windows / macOS / Linux). */
const { execSync } = require("child_process");

const url = "http://localhost:3001";

try {
  if (process.platform === "win32") {
    execSync(`start "" "${url}"`, { shell: true, stdio: "ignore" });
  } else if (process.platform === "darwin") {
    execSync(`open "${url}"`, { stdio: "ignore" });
  } else {
    execSync(`xdg-open "${url}"`, { stdio: "ignore" });
  }
} catch {
  process.exitCode = 0;
}
