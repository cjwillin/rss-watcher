from __future__ import annotations

import asyncio
import hashlib
import re
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable

import feedparser
import httpx

from . import db
from .notifier import PushoverConfig, SmtpConfig, env_pushover, env_smtp, send_email, send_pushover


def _now_utc_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _entry_key(entry: dict) -> str:
    # Prefer stable IDs; fall back to link or hashed title+published.
    for k in ("id", "guid", "link"):
        v = (entry.get(k) or "").strip()
        if v:
            return v
    raw = f"{entry.get('title','')}|{entry.get('published','')}|{entry.get('updated','')}"
    return hashlib.sha256(raw.encode("utf-8", errors="ignore")).hexdigest()


def _entry_text(entry: dict) -> str:
    parts: list[str] = []
    for k in ("title", "summary", "description"):
        v = entry.get(k)
        if isinstance(v, str) and v.strip():
            parts.append(v)
    content = entry.get("content")
    if isinstance(content, list):
        for c in content:
            v = (c or {}).get("value")
            if isinstance(v, str) and v.strip():
                parts.append(v)
    return "\n".join(parts)


@dataclass(frozen=True)
class Match:
    rule_id: int
    keyword: str


def _load_rules(con: sqlite3.Connection) -> list[sqlite3.Row]:
    return con.execute(
        "SELECT id, keyword, feed_id FROM rules WHERE enabled = 1 ORDER BY id ASC"
    ).fetchall()


def _normalize_keyword(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip())


def _find_matches(feed_id: int, text: str, rules: Iterable[sqlite3.Row]) -> list[Match]:
    hay = text.lower()
    out: list[Match] = []
    for r in rules:
        kw = _normalize_keyword(r["keyword"])
        if not kw:
            continue
        if r["feed_id"] is not None and int(r["feed_id"]) != int(feed_id):
            continue
        if kw.lower() in hay:
            out.append(Match(rule_id=int(r["id"]), keyword=kw))
    return out


async def _fetch_feed(url: str) -> bytes:
    async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
        r = await client.get(url, headers={"User-Agent": "rss-watcher/1.0"})
        r.raise_for_status()
        return r.content


async def poll_once() -> int:
    db.migrate()

    push_cfg: PushoverConfig | None = None
    smtp_cfg: SmtpConfig | None = None

    with db.connect() as con:
        # Environment overrides (preferred for secrets).
        push_cfg = env_pushover()
        smtp_cfg = env_smtp()

        if not push_cfg:
            t = db.kv_get(con, "pushover_app_token", "") or ""
            u = db.kv_get(con, "pushover_user_key", "") or ""
            if t.strip() and u.strip():
                push_cfg = PushoverConfig(app_token=t.strip(), user_key=u.strip())

        if not smtp_cfg:
            host = (db.kv_get(con, "smtp_host", "") or "").strip()
            port_s = (db.kv_get(con, "smtp_port", "") or "").strip()
            mail_from = (db.kv_get(con, "smtp_from", "") or "").strip()
            mail_to = (db.kv_get(con, "smtp_to", "") or "").strip()
            user = (db.kv_get(con, "smtp_user", "") or "").strip()
            password = (db.kv_get(con, "smtp_pass", "") or "").strip()
            try:
                port = int(port_s) if port_s else 0
            except ValueError:
                port = 0
            if host and port and mail_from and mail_to:
                smtp_cfg = SmtpConfig(
                    host=host, port=port, user=user, password=password, mail_from=mail_from, mail_to=mail_to
                )

        feeds = con.execute("SELECT id, name, url FROM feeds WHERE enabled = 1 ORDER BY id ASC").fetchall()
        rules = _load_rules(con)

    if not feeds or not rules:
        with db.connect() as con:
            db.kv_set(con, "last_poll_at", _now_utc_iso())
        return 0

    created_alerts = 0
    for f in feeds:
        feed_id = int(f["id"])
        url = str(f["url"])
        name = str(f["name"])
        try:
            content = await _fetch_feed(url)
            parsed = feedparser.parse(content)
        except Exception:
            continue

        for e in parsed.entries or []:
            ek = _entry_key(e)
            link = (e.get("link") or "").strip() or url
            title = (e.get("title") or "").strip() or "(untitled)"
            published = (e.get("published") or e.get("updated") or "").strip() or None
            summary = (e.get("summary") or e.get("description") or "").strip() or None
            text = _entry_text(e)
            matches = _find_matches(feed_id, text, rules)
            if not matches:
                continue

            with db.connect() as con:
                row = con.execute(
                    "SELECT id FROM entries WHERE feed_id = ? AND entry_key = ?",
                    (feed_id, ek),
                ).fetchone()
                if row:
                    entry_id = int(row["id"])
                else:
                    con.execute(
                        "INSERT OR IGNORE INTO entries(feed_id, entry_key, link, title, published, summary) VALUES(?, ?, ?, ?, ?, ?)",
                        (feed_id, ek, link, title, published, summary),
                    )
                    row2 = con.execute(
                        "SELECT id FROM entries WHERE feed_id = ? AND entry_key = ?",
                        (feed_id, ek),
                    ).fetchone()
                    if not row2:
                        continue
                    entry_id = int(row2["id"])

                for m in matches:
                    try:
                        con.execute(
                            "INSERT INTO alerts(entry_id, rule_id, keyword) VALUES(?, ?, ?)",
                            (entry_id, m.rule_id, m.keyword),
                        )
                    except sqlite3.IntegrityError:
                        continue

                    created_alerts += 1
                    subj = f"RSS Watcher: '{m.keyword}' in {name}"
                    msg = f"{title}\n\nFeed: {name}\nKeyword: {m.keyword}\nLink: {link}\n"

                    if push_cfg:
                        try:
                            await send_pushover(push_cfg, subj, title, link)
                        except Exception:
                            pass
                    if smtp_cfg:
                        try:
                            send_email(smtp_cfg, subj, msg)
                        except Exception:
                            pass

    with db.connect() as con:
        db.kv_set(con, "last_poll_at", _now_utc_iso())
        if created_alerts:
            db.kv_set(con, "last_alert_at", _now_utc_iso())
    return created_alerts


async def run_loop(stop_event: asyncio.Event) -> None:
    db.migrate()
    while not stop_event.is_set():
        with db.connect() as con:
            interval_s = db.kv_get(con, "poll_interval_seconds", "300") or "300"
        try:
            interval = max(60, int(interval_s))
        except ValueError:
            interval = 300

        try:
            await poll_once()
        except Exception:
            pass

        # Sleep in small increments so stop is responsive.
        for _ in range(interval):
            if stop_event.is_set():
                break
            await asyncio.sleep(1)

