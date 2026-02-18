from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


def db_path() -> str:
    return os.environ.get("RSSWATCHER_DB_PATH", "./data/rss-watcher.db")


def ensure_parent_dir(path: str) -> None:
    Path(path).expanduser().resolve().parent.mkdir(parents=True, exist_ok=True)


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    path = db_path()
    ensure_parent_dir(path)
    con = sqlite3.connect(path, timeout=30, isolation_level=None)
    try:
        con.row_factory = sqlite3.Row
        con.execute("PRAGMA journal_mode=WAL;")
        con.execute("PRAGMA foreign_keys=ON;")
        yield con
    finally:
        con.close()


def migrate() -> None:
    with connect() as con:
        con.executescript(
            """
            CREATE TABLE IF NOT EXISTS feeds (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              url TEXT NOT NULL UNIQUE,
              enabled INTEGER NOT NULL DEFAULT 1,
              created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS rules (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              keyword TEXT NOT NULL,
              feed_id INTEGER NULL REFERENCES feeds(id) ON DELETE CASCADE,
              enabled INTEGER NOT NULL DEFAULT 1,
              created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS entries (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              feed_id INTEGER NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
              entry_key TEXT NOT NULL,
              link TEXT NOT NULL,
              title TEXT NOT NULL,
              published TEXT NULL,
              summary TEXT NULL,
              seen_at TEXT NOT NULL DEFAULT (datetime('now')),
              UNIQUE(feed_id, entry_key)
            );

            CREATE TABLE IF NOT EXISTS alerts (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
              rule_id INTEGER NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
              keyword TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT (datetime('now')),
              UNIQUE(entry_id, rule_id)
            );

            CREATE TABLE IF NOT EXISTS kv (
              k TEXT PRIMARY KEY,
              v TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS app_log (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              ts TEXT NOT NULL DEFAULT (datetime('now')),
              level TEXT NOT NULL,
              area TEXT NOT NULL,
              message TEXT NOT NULL,
              feed_id INTEGER NULL REFERENCES feeds(id) ON DELETE SET NULL,
              rule_id INTEGER NULL REFERENCES rules(id) ON DELETE SET NULL,
              entry_link TEXT NULL,
              error TEXT NULL
            );
            """
        )


def kv_get(con: sqlite3.Connection, k: str, default: str | None = None) -> str | None:
    row = con.execute("SELECT v FROM kv WHERE k = ?", (k,)).fetchone()
    return row["v"] if row else default


def kv_set(con: sqlite3.Connection, k: str, v: str) -> None:
    con.execute(
        "INSERT INTO kv(k, v) VALUES(?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v",
        (k, v),
    )


def log_write(
    con: sqlite3.Connection,
    *,
    level: str,
    area: str,
    message: str,
    feed_id: int | None = None,
    rule_id: int | None = None,
    entry_link: str | None = None,
    error: str | None = None,
) -> None:
    con.execute(
        """
        INSERT INTO app_log(level, area, message, feed_id, rule_id, entry_link, error)
        VALUES(?, ?, ?, ?, ?, ?, ?)
        """,
        (level, area, message, feed_id, rule_id, entry_link, error),
    )

    # Keep logs bounded (default 2000 rows) to avoid unbounded DB growth.
    max_rows_s = (kv_get(con, "log_max_rows", "2000") or "2000").strip()
    try:
        max_rows = max(200, int(max_rows_s))
    except ValueError:
        max_rows = 2000

    con.execute(
        """
        DELETE FROM app_log
        WHERE id < (
          SELECT COALESCE(MAX(id) - ?, 0) FROM app_log
        )
        """,
        (max_rows,),
    )

