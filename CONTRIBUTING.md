# Contributing

## Setup

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn rss_watcher.main:app --host 0.0.0.0 --port 8080
```

## Code Style

- Keep dependencies minimal
- Favor explicit, readable code over cleverness
- Avoid adding heavy frontend build steps (this UI is intentionally static CSS + templates)

