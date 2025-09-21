import { z } from "zod/v4";
import dotenv from "dotenv";

dotenv.config();

const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: envFile });

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	PORT: z.coerce.number().default(3000),

	MYSQL_HOST: z.string().min(1, "MYSQL_HOST is required"),
	MYSQL_PORT: z.coerce.number().default(3306),
	MYSQL_USER: z.string().min(1, "MYSQL_USER is required"),
	MYSQL_PASSWORD: z.string().min(1, "MYSQL_PASSWORD is required"),
	MYSQL_DB: z.string().min(1, "MYSQL_DB is required"),

	JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),

	RATE_WINDOW_MS: z.coerce.number().default(60000),
	RATE_MAX: z.coerce.number().default(60),
});

try {
  envSchema.parse(process.env);
}
catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Missing environment variables:", error.issues.flatMap(issue => issue.path));
  }
  else {
    console.error(error);
  }
  process.exit();
}

export const env = envSchema.parse(process.env);
