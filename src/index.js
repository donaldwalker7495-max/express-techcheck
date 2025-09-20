import app from "./app.js";
import { env } from "./env.js";
import { createTables } from "./db/schema.js";

// Initialize database tables
createTables().catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});

const server = app.listen(env.PORT, () => {
  /* eslint-disable no-console */
  console.log(`Listening: http://localhost:${env.PORT}`);
  /* eslint-enable no-console */
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${env.PORT} is already in use. Please choose another port or stop the process using it.`
    );
  } else {
    console.error("Failed to start server:", err);
  }
  process.exit(1);
});
