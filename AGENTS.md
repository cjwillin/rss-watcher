# Agent Notes (Public Repo)

This repo is public and is often modified by coding agents across sessions.

## Non-Negotiables

- Do **not** commit secrets (tokens, OAuth client secrets, DB URLs with passwords, API keys).
- Keep environment files local-only (examples: `.env*`, `.secrets/*`, `.vercel/*`).
- Use GitHub Actions Secrets and/or Vercel Environment Variables for all runtime secrets.
- Avoid committing infrastructure identifiers (hostnames, internal IPs, container IDs).

## Session State

Agents should persist handoff notes to a **local** markdown file outside the git repo (not committed).
