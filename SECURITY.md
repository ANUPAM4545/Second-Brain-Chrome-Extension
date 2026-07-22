# Security Policy

## Supported Versions

Currently, we only apply security patches to the `main` branch. 

## Reporting a Vulnerability

Security is a top priority for a local-first application. If you discover a security vulnerability, please DO NOT open a public issue.

Instead, please send an email to `security@example.com` (replace with actual security contact). 

We will acknowledge receipt of your vulnerability report and strive to send you regular updates about our progress.

## Threat Model

As a local-first Chrome extension, the primary threats we defend against are:
1. **Data Exfiltration**: Ensuring indexed pages and embeddings are never sent to unauthorized third parties.
2. **XSS via LLM Output**: Ensuring the UI safely renders streamed markdown/text from the LLM to prevent injection attacks.
3. **Storage Isolation**: Relying on Chrome's extension isolation to protect the IndexedDB data from arbitrary websites.

If you find a bypass to any of these defenses, please report it immediately.
