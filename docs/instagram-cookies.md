# Instagram Cookie Authentication for Video Processing

When importing recipes from Instagram videos, authentication is required. This guide explains how to set up cookie-based authentication using an environment variable.

## Setup Instructions

### 1. Export Cookies from Your Browser

Use a browser extension to export your Instagram cookies in **Netscape format**:

- **Chrome**: [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
- **Firefox**: [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

Steps:
1. Log in to Instagram in your browser
2. Click the extension icon while on instagram.com
3. Export/download the cookies as `cookies.txt`

### 2. Encode the Cookies as Base64

Convert the cookies file content to base64:

```bash
# Linux/macOS
base64 -w 0 cookies.txt

# Or using cat and base64
cat cookies.txt | base64 -w 0
```

Copy the entire output string.

### 3. Set the Environment Variable

Add the base64-encoded cookies to your deployment:

**For docker-compose (.env file):**
```bash
INSTAGRAM_COOKIES=TmV0c2NhcGUgSFRUUCBDb29raWUgRmls...
```

**For Coolify/Railway/etc:**
Add `INSTAGRAM_COOKIES` as an environment variable with the base64 string.

### 4. Restart the Container

```bash
docker compose down
docker compose up -d
```

## Maintaining Cookies

- **Cookies expire**: Instagram session cookies typically last a few weeks to months
- **Re-export when needed**: If you start seeing authentication errors again, export fresh cookies and update the env var
- **Stay logged in**: Keep your Instagram session active in the browser you used to export

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Still getting login errors | Re-export cookies, ensure you're logged into Instagram |
| Base64 decode errors | Make sure there are no line breaks in the base64 string |
| Permission errors | The app will create the cookies file with proper permissions |

## Security Notes

- The cookies content is stored in your environment variables - keep them secure
- Don't commit the `.env` file with credentials to version control
- The cookies file is written to the container's temp directory with restricted permissions (600)
