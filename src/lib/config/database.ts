import { Pool, PoolClient } from "pg";
import { logger } from "../utils/logger";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on("error", (err) => {
      logger.error("Unexpected database pool error", { error: err.message });
    });

    logger.info("Database connection pool created");
  }

  return pool;
}

export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const start = Date.now();
  const poolInstance = getPool();

  try {
    const result = await poolInstance.query(text, params);
    const duration = Date.now() - start;

    logger.debug("Database query executed", {
      duration: `${duration}ms`,
      rows: result.rowCount,
    });

    return result.rows as T[];
  } catch (error) {
    logger.error("Database query failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      query: text,
    });
    throw error;
  }
}

export async function queryOne<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function getClient(): Promise<PoolClient> {
  const poolInstance = getPool();
  return await poolInstance.connect();
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function initializeSchema(): Promise<void> {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      firebase_uid VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
      subscription_status VARCHAR(20) DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled')),
      stripe_customer_id VARCHAR(255),
      github_username VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      email_verified BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
      github_repo VARCHAR(255),
      deployed_url TEXT,
      error_message TEXT,
      architecture_prompt TEXT,
      code_prompt TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS websites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      framework VARCHAR(50),
      pages JSONB DEFAULT '[]'::jsonb,
      components JSONB DEFAULT '[]'::jsonb,
      styles JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tier VARCHAR(20) NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise')),
      status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive', 'past_due', 'canceled')),
      stripe_subscription_id VARCHAR(255) UNIQUE,
      stripe_price_id VARCHAR(255),
      current_period_start TIMESTAMPTZ,
      current_period_end TIMESTAMPTZ,
      cancel_at_period_end BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
      amount DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(3) NOT NULL,
      status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
      stripe_payment_intent_id VARCHAR(255) UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ai_generation_status (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      stage VARCHAR(20) NOT NULL CHECK (stage IN ('architecture', 'engineering', 'deployment', 'completed', 'failed')),
      progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
      current_step TEXT,
      estimated_time_remaining INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_generation_status_project_id ON ai_generation_status(project_id);
  `;

  try {
    await query(schema);
    logger.info("Database schema initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize database schema", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info("Database connection pool closed");
  }
}
