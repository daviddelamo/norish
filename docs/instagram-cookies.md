# Instagram Cookie Authentication for Video Processing

When importing recipes from Instagram videos, authentication may be required. This guide explains how to set up cookie-based authentication.

## Why Cookies Are Needed

Instagram requires login to access most video content. When you see an error like:

```
ERROR: [Instagram] Requested content is not available, rate-limit reached or login required.
```

You need to provide authentication cookies from your browser.

## Setup Instructions

### 1. Export Cookies from Your Browser

Use a browser extension to export your Instagram cookies in **Netscape format**:

- **Chrome**: [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
- **Firefox**: [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

Steps:
1. Log in to Instagram in your browser
2. Click the extension icon while on instagram.com
3. Export/download the cookies as `cookies.txt`

### 2. Place the File

Save the exported file as `instagram-cookies.txt` in the same directory as your `docker-compose.yaml`.

### 3. Update docker-compose.yaml

Uncomment the following lines in your `docker-compose.yaml`:

```yaml
services:
  norish:
    volumes:
      - 'norish_data:/app/uploads'
      - './instagram-cookies.txt:/app/config/instagram-cookies.txt:ro'  # Uncomment this
    environment:
      # ... other env vars ...
      INSTAGRAM_COOKIES_PATH: '/app/config/instagram-cookies.txt'  # Uncomment this
```

### 4. Restart the Container

```bash
docker compose down
docker compose up -d
```

## Maintaining Cookies

- **Cookies expire**: Instagram session cookies typically last a few weeks to months
- **Re-export when needed**: If you start seeing authentication errors again, export fresh cookies
- **Stay logged in**: Keep your Instagram session active in the browser you used to export

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Still getting login errors | Re-export cookies, ensure you're logged into Instagram |
| File not found errors | Check the file path and permissions |
| Container can't read file | Ensure the file has read permissions (`chmod 644`) |

## Security Notes

- The cookies file contains your Instagram session - keep it secure
- The `:ro` mount flag makes it read-only inside the container
- Don't commit this file to version control (it's in `.gitignore`)
