# Deploy With systemd (Ubuntu)

This is the recommended production setup (simple, reliable, no extra runtime).

## 1) Create a user and install files

Assume app lives in `/opt/rss-watcher`:

```bash
sudo useradd --system --home /opt/rss-watcher --shell /usr/sbin/nologin rsswatcher || true
sudo mkdir -p /opt/rss-watcher
sudo chown -R rsswatcher:rsswatcher /opt/rss-watcher
```

Create a venv and install dependencies:

```bash
cd /opt/rss-watcher
python3 -m venv .venv
. .venv/bin/activate
pip install -U pip
pip install -r requirements.txt
```

## 2) Create `/etc/rss-watcher.env`

Keep secrets out of the DB by putting them in an env file:

```bash
sudo install -m 600 -o root -g root /dev/null /etc/rss-watcher.env
sudoedit /etc/rss-watcher.env
```

Example:

```bash
PUSHOVER_APP_TOKEN=...
PUSHOVER_USER_KEY=...

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=optional
SMTP_PASS=optional
SMTP_FROM=alerts@example.com
SMTP_TO=you@example.com
```

## 3) Install the systemd unit

Copy `deploy/rss-watcher.service` to:

- `/etc/systemd/system/rss-watcher.service`

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now rss-watcher
sudo systemctl status rss-watcher --no-pager
```

## 4) Reverse proxy (optional)

Run it behind Nginx/Caddy if you want TLS and authentication.

