
// import "dotenv/config";
// import app from "./src/app.js";
// import prisma from "./src/lib/prisma.js";
// import {
//   connectRabbitMQ,
//   closeRabbitMQ,
// } from "./src/config/rabbitmq.js";

// const PORT = Number(process.env.PORT) || 4000;

// async function startServer() {
//   let server;
//   let isShuttingDown = false;

//   async function shutdown(signal) {
//     if (isShuttingDown) return;
//     isShuttingDown = true;

//     console.log(`\n${signal} received. Shutting down...`);

//     let shutdownFailed = false;

//     // Stop accepting new HTTP requests first.
//     if (server) {
//       await new Promise((resolve) => {
//         server.close((error) => {
//           if (error) {
//             console.error("Error closing HTTP server:", error.message);
//             shutdownFailed = true;
//           } else {
//             console.log("HTTP server closed.");
//           }
//           resolve();
//         });
//       });
//     }

//     try {
//       await closeRabbitMQ();
//       console.log("RabbitMQ disconnected.");
//     } catch (error) {
//       shutdownFailed = true;
//       console.error("Error closing RabbitMQ:", error.message);
//     }

//     try {
//       await prisma.$disconnect();
//       console.log("PostgreSQL disconnected.");
//     } catch (error) {
//       shutdownFailed = true;
//       console.error("Error disconnecting PostgreSQL:", error.message);
//     }

//     process.exitCode = shutdownFailed ? 1 : 0;
//   }

//   try {
//     console.log("Connecting to PostgreSQL...");

//     await prisma.$connect();
//     await prisma.$queryRaw`SELECT 1`;

//     console.log("✅ PostgreSQL connected successfully!");

//     console.log("Connecting to RabbitMQ...");
//     await connectRabbitMQ();

//     console.log("✅ RabbitMQ connected successfully!");

//     server = app.listen(PORT, () => {
//       console.log(`🚀 Vettly API running at http://localhost:${PORT}`);
//     });

//     process.once("SIGINT", () => void shutdown("SIGINT"));
//     process.once("SIGTERM", () => void shutdown("SIGTERM"));
//   } catch (error) {
//     console.error("❌ API startup failed:", error.message);

//     try {
//       await closeRabbitMQ();
//     } catch (cleanupError) {
//       console.error("Error closing RabbitMQ:", cleanupError.message);
//     }

//     try {
//       await prisma.$disconnect();
//     } catch (cleanupError) {
//       console.error("Error disconnecting PostgreSQL:", cleanupError.message);
//     }

//     process.exitCode = 1;
//   }
// }

// await startServer();
import "dotenv/config";
import app from "./src/app.js";
import prisma from "./src/lib/prisma.js";
import {
  connectRabbitMQ,
  closeRabbitMQ,
} from "./src/config/rabbitmq.js";

const PORT = Number(process.env.PORT) || 4000;

async function startServer() {
  let server;
  let isShuttingDown = false;

  async function shutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n${signal} received. Shutting down...`);

    let shutdownFailed = false;

    // Stop accepting new HTTP requests first.
    if (server) {
      await new Promise((resolve) => {
        server.close((error) => {
          if (error) {
            console.error("Error closing HTTP server:", error.message);
            shutdownFailed = true;
          } else {
            console.log("HTTP server closed.");
          }
          resolve();
        });
      });
    }

    try {
      await closeRabbitMQ();
      console.log("RabbitMQ disconnected.");
    } catch (error) {
      // Ignore cleanup error if RabbitMQ was never connected
    }

    try {
      await prisma.$disconnect();
      console.log("PostgreSQL disconnected.");
    } catch (error) {
      shutdownFailed = true;
      console.error("Error disconnecting PostgreSQL:", error.message);
    }

    process.exitCode = shutdownFailed ? 1 : 0;
  }

  try {
    console.log("Connecting to PostgreSQL...");

    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;

    console.log("✅ PostgreSQL connected successfully!");

    // Non-blocking RabbitMQ connection for local dev
    try {
      console.log("Connecting to RabbitMQ...");
      await connectRabbitMQ();
      console.log("✅ RabbitMQ connected successfully!");
    } catch (rabbitErr) {
      console.warn("⚠️ RabbitMQ connection skipped for local dev:", rabbitErr.message);
    }

    server = app.listen(PORT, () => {
      console.log(`🚀 Vettly API running at http://localhost:${PORT}`);
    });

    process.once("SIGINT", () => void shutdown("SIGINT"));
    process.once("SIGTERM", () => void shutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ API startup failed:", error.message);

    try {
      await closeRabbitMQ();
    } catch (cleanupError) {
      // Ignore
    }

    try {
      await prisma.$disconnect();
    } catch (cleanupError) {
      console.error("Error disconnecting PostgreSQL:", cleanupError.message);
    }

    process.exitCode = 1;
  }
}

await startServer();