# Library UI (React)

A modern, calm and minimalistic React admin UI designed to work with your Library backend.

It ships with:
- **Login** (JWT stored in localStorage)
- **Overview** (health + OpenAPI presence)
- **Catalog / Members / Loans** pages that **auto-detect endpoints** from OpenAPI when possible
- **API Explorer** that reads **OpenAPI** and lets you call endpoints from the browser

> The UI is intentionally backend-agnostic: if your endpoints differ, use **API Explorer** to discover the correct paths and then adjust the page files in `src/pages/*.tsx`.

## Requirements
- Node.js 18+ (recommended)

## Configure
Create `.env` (optional):

```env
VITE_API_URL=http://localhost:8080
VITE_OPENAPI_PATH=/v3/api-docs
VITE_AUTH_LOGIN_PATH=/auth/login
```

You can also change the API URL inside the UI: **Settings → API URL**.

## Run

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Notes about authentication
The login page sends:

```json
{ "username": "...", "password": "..." }
```

and expects a response that includes one of:
- `token`
- `accessToken`
- `jwt`

If your backend uses a different JSON shape, adjust token mapping in:
`src/pages/Login.tsx`.
