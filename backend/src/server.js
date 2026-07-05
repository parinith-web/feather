import "dotenv/config";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { initFirebaseAdmin } from "./config/firebase.js";
import { initCloudinary } from "./config/cloudinary.js";

async function main() {
  initFirebaseAdmin();
  initCloudinary();
  await connectDB();

  const app = createApp();
  const port = process.env.PORT || 5000;

  app.listen(port, () => {
    console.log(`[server] snapcut-backend listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
