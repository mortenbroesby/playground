import { createRequire } from "node:module";

import type {
  EngineIndexBackend,
  IndexBackendConnection,
  IndexBackendValue,
  IndexStatement,
  IndexStatementRunResult,
} from "./index-backend.ts";

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite");

class SqliteStatement implements IndexStatement {
  private readonly statement: import("node:sqlite").StatementSync;

  constructor(statement: import("node:sqlite").StatementSync) {
    this.statement = statement;
  }

  all(...params: IndexBackendValue[]): unknown[] {
    return this.statement.all(...params) as unknown[];
  }

  get(...params: IndexBackendValue[]): unknown {
    return this.statement.get(...params);
  }

  run(...params: IndexBackendValue[]): IndexStatementRunResult {
    const result = this.statement.run(...params);
    return {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid,
    };
  }
}

class SqliteConnection implements IndexBackendConnection {
  readonly backendName = "sqlite";
  private readonly db: import("node:sqlite").DatabaseSync;
  private readonly statementCache = new Map<string, SqliteStatement>();

  constructor(db: import("node:sqlite").DatabaseSync) {
    this.db = db;
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  prepare(sql: string): IndexStatement {
    let statement = this.statementCache.get(sql);
    if (!statement) {
      statement = new SqliteStatement(this.db.prepare(sql));
      this.statementCache.set(sql, statement);
    }

    return statement;
  }

  close(): void {
    this.statementCache.clear();
    this.db.close();
  }
}

class SqliteIndexBackend implements EngineIndexBackend {
  readonly backendName = "sqlite";

  open(databasePath: string): IndexBackendConnection {
    return new SqliteConnection(new DatabaseSync(databasePath));
  }
}

export const SQLITE_INDEX_BACKEND: EngineIndexBackend = new SqliteIndexBackend();
