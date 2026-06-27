# MCP Setup Guide

The site is controllable via Claude AI through an MCP server hosted at `/mcp/`.
This guide walks you through generating credentials and connecting Claude Desktop.

---

## How it works

```
Claude Desktop  →  POST https://yourdomain.com/mcp/  →  Next.js app  →  Database
                       (Bearer token auth)
```

You create an **OAuth client** (one-time), run an authorization flow to get an
**access token**, then paste that token into Claude Desktop. Done.

---

## Connecting from claude.ai (web/desktop connectors)

When you add this MCP server as a **connector in claude.ai**, you do **not** create
a client by hand. Claude discovers the server's OAuth metadata at
`/.well-known/oauth-authorization-server` and uses **Dynamic Client Registration
(RFC 7591)** to register itself automatically — including its callback URL
`https://claude.ai/api/mcp/auth_callback` — by POSTing to `/api/oauth/register`.

You then get redirected to the consent screen, log in as admin, and click
**Allow**. That's it — no manual `clientId`/redirect-URI setup.

> If you previously saw `redirect_uri not registered for this client`, it was
> because the server had no registration endpoint and the manually-created client
> didn't list claude.ai's callback URL. Registration now handles this for you.

The steps below are only needed for **Claude Desktop's `claude_desktop_config.json`**
(static token) setup.

---

## Step 1 — Create an OAuth client

Log into your admin panel, then run this in a terminal (or use any HTTP client):

```bash
curl -X POST https://yourdomain.com/api/oauth/clients \
  -H "Cookie: YOUR_ADMIN_SESSION_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Claude Desktop",
    "redirectUrls": ["http://localhost:3456/callback"]
  }'
```

**Response:**
```json
{
  "id": "clxxx...",
  "name": "Claude Desktop",
  "clientId": "abc123def456...",
  "clientSecret": "xyz789...",
  "redirectUrls": ["http://localhost:3456/callback"]
}
```

Save `clientId` and `clientSecret` — you need them in Step 2.

> You can use any redirect URL you control. `localhost` URLs work fine since the
> authorization code is just copied from the browser URL bar.

---

## Step 2 — Authorize and get the access token

### 2a. Open the authorization URL in your browser

```
https://yourdomain.com/api/oauth/authorize
  ?response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=http://localhost:3456/callback
  &state=setup
```

You'll be prompted to log in as admin if not already, then shown a consent page.
Click **Allow**.

### 2b. Copy the code from the redirect URL

Your browser will redirect to something like:
```
http://localhost:3456/callback?code=aabbccdd...&state=setup
```

Copy the value of `code` from the URL.

### 2c. Exchange the code for an access token

```bash
curl -X POST https://yourdomain.com/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "aabbccdd...",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uri": "http://localhost:3456/callback"
  }'
```

**Response:**
```json
{
  "access_token": "fffaaa111222...",
  "token_type": "Bearer",
  "expires_in": 7776000
}
```

Save `access_token`. This is valid for **90 days**.

---

## Step 3 — Configure Claude Desktop

Open `~/Library/Application Support/Claude/claude_desktop_config.json`
(macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows).

Add the following under `mcpServers`:

```json
{
  "mcpServers": {
    "site-manager": {
      "url": "https://yourdomain.com/mcp/",
      "headers": {
        "Authorization": "Bearer YOUR_ACCESS_TOKEN"
      }
    }
  }
}
```

Restart Claude Desktop. You should see **site-manager** appear in the tools panel.

---

## Verify it works

Open a conversation in Claude Desktop and ask:

> "List all my blog posts"

or

> "What is the current theme of my site?"

Claude will call the MCP tools and return live data from your site.

---

## Available tools (30 total)

### Blog posts
| Tool | What it does |
|------|-------------|
| `list_posts` | List all posts (drafts included by default) |
| `get_post` | Fetch a post by ID including full HTML content |
| `create_post` | Create a post using structured blocks or raw HTML |
| `update_post` | Update any post field |
| `publish_post` | Publish or unpublish a post |

### Portfolio projects
| Tool | What it does |
|------|-------------|
| `list_projects` | List all projects in display order |
| `get_project` | Fetch a project by ID |
| `create_project` | Create a new project |
| `update_project` | Update any project field |
| `delete_project` | Delete a project |
| `reorder_projects` | Set display order for multiple projects |

### Landing page sections
| Tool | What it does |
|------|-------------|
| `get_site_section` | Read current content of hero/about/navbar/contact/footer/sections |
| `update_hero` | Update name, title, bio, image, CTAs, social links |
| `update_about` | Update bio paragraphs and skills list |
| `update_navbar` | Update brand name and nav links |
| `update_contact` | Update email, phone, address, contact links |
| `update_footer` | Update copyright name |
| `update_sections` | Show/hide individual page sections |

### Appearance
| Tool | What it does |
|------|-------------|
| `list_themes` | List all color themes |
| `get_active_theme` | Get the currently active theme |
| `set_theme` | Switch color theme |
| `list_designs` | List all UI design styles |
| `get_active_design` | Get the currently active design |
| `set_design` | Switch UI design style |

### Tags
| Tool | What it does |
|------|-------------|
| `list_tags` | List all tags with post/project counts |
| `create_tag` | Create a new tag |
| `update_tag` | Rename a tag |
| `delete_tag` | Delete a tag |

### Media & utilities
| Tool | What it does |
|------|-------------|
| `upload_image_from_url` | Download a public image and host it on the CDN |
| `build_html_content` | Preview: convert blocks to HTML without saving |

---

## Creating rich blog content

Claude understands the blog editor's HTML format. You can ask it to create
posts with formatting using natural language:

> "Write a post titled 'Getting started with TypeScript' with an introduction
> paragraph in bold red, three code block examples, and a bullet list of tips.
> Publish it."

Or use structured blocks explicitly:

```
Create a post with:
- H2 heading: "Introduction"  
- Paragraph: "This is bold and italic text" (bold + italic)
- Image from: https://example.com/photo.jpg
- Bullet list: ["Item one", "Item two", "Item three"]
```

**Supported formatting:**
- Bold, italic, strikethrough, inline code
- Links, headings (H2/H3/H4)
- Bullet and ordered lists
- Blockquotes, code blocks (with syntax highlighting)
- Images (use `upload_image_from_url` first to get a CDN URL)
- Text color, background color, font family, font size

---

## Managing OAuth clients

**List clients** (admin session required):
```bash
GET /api/oauth/clients
```

**Delete a client** (revokes all its tokens):
```bash
curl -X DELETE https://yourdomain.com/api/oauth/clients \
  -H "Cookie: YOUR_ADMIN_SESSION_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{ "id": "CLIENT_DB_ID" }'
```

---

## Health check

```bash
curl https://yourdomain.com/mcp/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Returns:
```json
{
  "name": "site-manager",
  "version": "1.0.0",
  "transport": "streamable-http",
  "toolCount": 30,
  "tools": ["list_posts", "get_post", ...]
}
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Unauthorized` from `/mcp/` | Token expired or wrong — redo Step 2 |
| `invalid_grant` from `/api/oauth/token` | Auth code expired (10 min limit) — redo Step 2a–2b |
| `Invalid redirect_uri` | The URI must exactly match what you registered in Step 1 |
| Tools not showing in Claude Desktop | Restart Claude Desktop after editing the config file |
| `Unknown client_id` | Check that `clientId` (not `id`) is used in the authorize URL |
