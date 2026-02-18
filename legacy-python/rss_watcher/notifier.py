from __future__ import annotations

import os
import smtplib
from dataclasses import dataclass
from email.message import EmailMessage
from typing import Optional

import httpx


@dataclass(frozen=True)
class PushoverConfig:
    app_token: str
    user_key: str


@dataclass(frozen=True)
class SmtpConfig:
    host: str
    port: int
    user: str
    password: str
    mail_from: str
    mail_to: str


def env_pushover() -> Optional[PushoverConfig]:
    app_token = os.environ.get("PUSHOVER_APP_TOKEN", "").strip()
    user_key = os.environ.get("PUSHOVER_USER_KEY", "").strip()
    if not app_token or not user_key:
        return None
    return PushoverConfig(app_token=app_token, user_key=user_key)


def env_smtp() -> Optional[SmtpConfig]:
    host = os.environ.get("SMTP_HOST", "").strip()
    port_s = os.environ.get("SMTP_PORT", "").strip()
    user = os.environ.get("SMTP_USER", "").strip()
    password = os.environ.get("SMTP_PASS", "").strip()
    mail_from = os.environ.get("SMTP_FROM", "").strip()
    mail_to = os.environ.get("SMTP_TO", "").strip()
    if not host or not port_s or not mail_from or not mail_to:
        return None
    try:
        port = int(port_s)
    except ValueError:
        return None
    # user/pass optional (supports unauthenticated relay)
    return SmtpConfig(host=host, port=port, user=user, password=password, mail_from=mail_from, mail_to=mail_to)


async def send_pushover(cfg: PushoverConfig, title: str, message: str, url: str) -> None:
    payload = {
        "token": cfg.app_token,
        "user": cfg.user_key,
        "title": title[:250],
        "message": message[:1024],
        "url": url[:500],
        "url_title": "Open item",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post("https://api.pushover.net/1/messages.json", data=payload)
        r.raise_for_status()


def send_email(cfg: SmtpConfig, subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = cfg.mail_from
    msg["To"] = cfg.mail_to
    msg.set_content(body)

    with smtplib.SMTP(cfg.host, cfg.port, timeout=20) as smtp:
        try:
            smtp.starttls()
        except smtplib.SMTPException:
            # Some SMTP servers are plaintext-only; allow it.
            pass
        if cfg.user and cfg.password:
            smtp.login(cfg.user, cfg.password)
        smtp.send_message(msg)

