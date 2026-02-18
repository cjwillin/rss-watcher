# Testing

## Automated (pytest)

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
pytest -q
```

The tests run a fully offline integration pass:

- a fake RSS feed is served via mocked HTTP
- the watcher polls once
- the DB is asserted for entries + alerts
- notification delivery is intercepted (no real Pushover/SMTP calls)

## Manual End-to-End

1. Start the app and open the UI.
2. Add a feed with known content.
3. Add a rule that matches an item title/summary.
4. Wait for the next poll interval.
5. Verify:
   - the alert appears on the home page
   - `/logs` shows poll -> match -> notify steps
6. Add Pushover credentials and verify iOS push arrives.
7. Add SMTP credentials and verify email arrives.

## Quick Debug Poll (no UI)

Run a single poll once from the server:

```bash
python3 -c "import asyncio; from rss_watcher.watcher import poll_once; print(asyncio.run(poll_once()))"
```

