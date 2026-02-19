import os
import sqlite3

import pytest
import respx

from rss_watcher import db
from rss_watcher import watcher


RSS_XML = """<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Example Feed</title>
    <link>http://example.test/</link>
    <description>Example</description>
    <item>
      <title>Breaking: ransomware hits ACME</title>
      <link>http://example.test/a</link>
      <guid>item-a</guid>
      <description>Something happened</description>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>
"""


@pytest.mark.asyncio
async def test_poll_once_creates_alert_and_logs(tmp_path, monkeypatch):
    db_file = tmp_path / "t.db"
    monkeypatch.setenv("RSSWATCHER_DB_PATH", str(db_file))

    feed_url = "https://feed.test/rss.xml"

    # Seed DB with one feed and one rule.
    db.migrate()
    with db.connect() as con:
        con.execute("INSERT INTO feeds(name, url, enabled) VALUES(?, ?, 1)", ("Example", feed_url))
        con.execute("INSERT INTO rules(keyword, feed_id, enabled) VALUES(?, NULL, 1)", ("ransomware",))

    # Capture notification calls (no real network).
    sent = {"push": 0, "email": 0}

    async def fake_send_pushover(cfg, title, message, url):
        sent["push"] += 1

    def fake_send_email(cfg, subject, body):
        sent["email"] += 1

    monkeypatch.setattr(watcher, "send_pushover", fake_send_pushover)
    monkeypatch.setattr(watcher, "send_email", fake_send_email)

    # Enable push/email configs via env (so poll_once tries to notify).
    monkeypatch.setenv("PUSHOVER_APP_TOKEN", "test_app")
    monkeypatch.setenv("PUSHOVER_USER_KEY", "test_user")
    monkeypatch.setenv("SMTP_HOST", "smtp.test")
    monkeypatch.setenv("SMTP_PORT", "587")
    monkeypatch.setenv("SMTP_FROM", "alerts@test")
    monkeypatch.setenv("SMTP_TO", "you@test")

    with respx.mock(assert_all_called=True) as router:
        router.get(feed_url).respond(200, text=RSS_XML)
        # Pushover HTTP is bypassed by fake_send_pushover; no route needed.

        created = await watcher.poll_once()

    assert created == 1
    assert sent["push"] == 1
    assert sent["email"] == 1

    with db.connect() as con:
        alerts = con.execute("SELECT keyword FROM alerts").fetchall()
        assert len(alerts) == 1
        assert alerts[0]["keyword"] == "ransomware"

        # Ensure we wrote some logs, including poll start/finish.
        logs = con.execute("SELECT area, level, message FROM app_log ORDER BY id ASC").fetchall()
        assert any(r["area"] == "poll" and r["level"] == "info" for r in logs)


@pytest.mark.asyncio
async def test_new_feed_is_baselined_no_alerts_then_alerts_on_new_items(tmp_path, monkeypatch):
    db_file = tmp_path / "t.db"
    monkeypatch.setenv("RSSWATCHER_DB_PATH", str(db_file))

    feed_url_1 = "https://feed.test/rss.xml"
    feed_url_2 = "https://feed.test/rss2.xml"

    rss1 = RSS_XML
    rss2 = RSS_XML.replace("item-a", "item-b").replace("http://example.test/a", "http://example.test/b")

    db.migrate()
    with db.connect() as con:
        # New feed starts armed=0 so the first poll baselines it without alerts.
        con.execute("INSERT INTO feeds(name, url, enabled, armed) VALUES(?, ?, 1, 0)", ("Example", feed_url_1))
        con.execute("INSERT INTO rules(keyword, feed_id, enabled) VALUES(?, NULL, 1)", ("ransomware",))

    with respx.mock(assert_all_called=True) as router:
        router.get(feed_url_1).respond(200, text=rss1)
        created1 = await watcher.poll_once()
        assert created1 == 0

        # Polling again with the same (baselined) item should not alert.
        router.get(feed_url_1).respond(200, text=rss1)
        created1b = await watcher.poll_once()
        assert created1b == 0

        # Change the feed URL (simulates the next poll seeing a "new" item).
        with db.connect() as con:
            con.execute("UPDATE feeds SET url = ? WHERE name = ?", (feed_url_2, "Example"))

        router.get(feed_url_2).respond(200, text=rss2)
        created2 = await watcher.poll_once()
        assert created2 == 1
