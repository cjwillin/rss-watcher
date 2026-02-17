from __future__ import annotations

import asyncio
import contextlib
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from . import db
from .watcher import run_loop


APP_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(APP_DIR / "templates"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.migrate()
    stop = asyncio.Event()
    task = asyncio.create_task(run_loop(stop))
    try:
        yield
    finally:
        stop.set()
        task.cancel()
        with contextlib.suppress(Exception):
            await task


app = FastAPI(title="RSS Watcher", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=str(APP_DIR / "static")), name="static")


def _kv(k: str, default: str = "") -> str:
    with db.connect() as con:
        return (db.kv_get(con, k, default) or default).strip()


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    with db.connect() as con:
        feeds = con.execute("SELECT id, name, url, enabled FROM feeds ORDER BY id DESC").fetchall()
        rules = con.execute("SELECT id, keyword, feed_id, enabled FROM rules ORDER BY id DESC").fetchall()
        alerts = con.execute(
            """
            SELECT a.id, a.keyword, a.created_at, e.title, e.link, f.name AS feed_name
            FROM alerts a
            JOIN entries e ON e.id = a.entry_id
            JOIN feeds f ON f.id = e.feed_id
            ORDER BY a.id DESC
            LIMIT 25
            """
        ).fetchall()
        last_poll_at = db.kv_get(con, "last_poll_at", "") or ""
        last_alert_at = db.kv_get(con, "last_alert_at", "") or ""
        poll_interval_seconds = db.kv_get(con, "poll_interval_seconds", "300") or "300"
    return templates.TemplateResponse(
        request,
        "index.html",
        {
            "feeds": feeds,
            "rules": rules,
            "alerts": alerts,
            "last_poll_at": last_poll_at,
            "last_alert_at": last_alert_at,
            "poll_interval_seconds": poll_interval_seconds,
        },
    )


@app.get("/feeds", response_class=HTMLResponse)
def feeds_page(request: Request):
    with db.connect() as con:
        feeds = con.execute("SELECT id, name, url, enabled FROM feeds ORDER BY id DESC").fetchall()
    return templates.TemplateResponse(request, "feeds.html", {"feeds": feeds})


@app.post("/feeds/add")
def feeds_add(name: str = Form(...), url: str = Form(...)):
    name = name.strip() or "Feed"
    url = url.strip()
    if not url:
        return RedirectResponse("/feeds", status_code=303)
    with db.connect() as con:
        con.execute(
            "INSERT OR IGNORE INTO feeds(name, url, enabled) VALUES(?, ?, 1)",
            (name, url),
        )
    return RedirectResponse("/feeds", status_code=303)


@app.post("/feeds/toggle")
def feeds_toggle(feed_id: int = Form(...)):
    with db.connect() as con:
        row = con.execute("SELECT enabled FROM feeds WHERE id = ?", (feed_id,)).fetchone()
        if row:
            enabled = 0 if int(row["enabled"]) else 1
            con.execute("UPDATE feeds SET enabled = ? WHERE id = ?", (enabled, feed_id))
    return RedirectResponse("/feeds", status_code=303)


@app.post("/feeds/delete")
def feeds_delete(feed_id: int = Form(...)):
    with db.connect() as con:
        con.execute("DELETE FROM feeds WHERE id = ?", (feed_id,))
    return RedirectResponse("/feeds", status_code=303)


@app.get("/rules", response_class=HTMLResponse)
def rules_page(request: Request):
    with db.connect() as con:
        rules = con.execute(
            """
            SELECT r.id, r.keyword, r.feed_id, r.enabled, f.name AS feed_name
            FROM rules r
            LEFT JOIN feeds f ON f.id = r.feed_id
            ORDER BY r.id DESC
            """
        ).fetchall()
        feeds = con.execute("SELECT id, name FROM feeds ORDER BY name ASC").fetchall()
    return templates.TemplateResponse(request, "rules.html", {"rules": rules, "feeds": feeds})


@app.post("/rules/add")
def rules_add(keyword: str = Form(...), feed_id: Optional[str] = Form(None)):
    keyword = keyword.strip()
    if not keyword:
        return RedirectResponse("/rules", status_code=303)
    fid = None
    if feed_id and feed_id.strip():
        try:
            fid = int(feed_id)
        except ValueError:
            fid = None
    with db.connect() as con:
        con.execute("INSERT INTO rules(keyword, feed_id, enabled) VALUES(?, ?, 1)", (keyword, fid))
    return RedirectResponse("/rules", status_code=303)


@app.post("/rules/toggle")
def rules_toggle(rule_id: int = Form(...)):
    with db.connect() as con:
        row = con.execute("SELECT enabled FROM rules WHERE id = ?", (rule_id,)).fetchone()
        if row:
            enabled = 0 if int(row["enabled"]) else 1
            con.execute("UPDATE rules SET enabled = ? WHERE id = ?", (enabled, rule_id))
    return RedirectResponse("/rules", status_code=303)


@app.post("/rules/delete")
def rules_delete(rule_id: int = Form(...)):
    with db.connect() as con:
        con.execute("DELETE FROM rules WHERE id = ?", (rule_id,))
    return RedirectResponse("/rules", status_code=303)


@app.get("/settings", response_class=HTMLResponse)
def settings_page(request: Request):
    keys = [
        "poll_interval_seconds",
        "pushover_app_token",
        "pushover_user_key",
        "smtp_host",
        "smtp_port",
        "smtp_user",
        "smtp_pass",
        "smtp_from",
        "smtp_to",
    ]
    with db.connect() as con:
        vals = {k: (db.kv_get(con, k, "") or "") for k in keys}
    return templates.TemplateResponse(request, "settings.html", {"vals": vals})


@app.post("/settings/save")
def settings_save(
    poll_interval_seconds: str = Form("300"),
    pushover_app_token: str = Form(""),
    pushover_user_key: str = Form(""),
    smtp_host: str = Form(""),
    smtp_port: str = Form(""),
    smtp_user: str = Form(""),
    smtp_pass: str = Form(""),
    smtp_from: str = Form(""),
    smtp_to: str = Form(""),
):
    with db.connect() as con:
        db.kv_set(con, "poll_interval_seconds", poll_interval_seconds.strip() or "300")
        db.kv_set(con, "pushover_app_token", pushover_app_token.strip())
        db.kv_set(con, "pushover_user_key", pushover_user_key.strip())
        db.kv_set(con, "smtp_host", smtp_host.strip())
        db.kv_set(con, "smtp_port", smtp_port.strip())
        db.kv_set(con, "smtp_user", smtp_user.strip())
        db.kv_set(con, "smtp_pass", smtp_pass)  # allow spaces
        db.kv_set(con, "smtp_from", smtp_from.strip())
        db.kv_set(con, "smtp_to", smtp_to.strip())
    return RedirectResponse("/settings", status_code=303)
