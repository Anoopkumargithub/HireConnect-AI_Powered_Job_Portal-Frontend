# HireConnect Frontend (AngularJS)

## Overview
This SPA uses AngularJS + ngRoute with CDN dependencies. No build tooling is required. The backend is served via the API gateway at `https://api.hireconnect.com`.

## Quick Start (Local with Nginx Docker)
```bash
cd /home/anoop/Downloads/CG/Zed/HireConnect

docker run --name hireconnect-web -p 8080:80 \
  -v "$PWD/frontend:/usr/share/nginx/html:ro" \
  -v "$PWD/frontend/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
  --rm nginx:alpine
```
Then visit `http://localhost:8080`.

## Alternative: Local static server
```bash
cd /home/anoop/Downloads/CG/Zed/HireConnect/frontend
python -m http.server 8080
```
Then visit `http://localhost:8080`.

## Structure
```text
frontend/
  index.html
  styles/
    app.css
  app/
    app.module.js
    app.routes.js
    app.run.js
    app.constants.js
    main.controller.js
    shared/
    auth/
    candidate/
    recruiter/
    admin/
```

## Creating the AngularJS App (from scratch)
```bash
mkdir -p frontend/styles \
  frontend/app/{auth,candidate,recruiter,admin,shared}

touch frontend/index.html \
  frontend/styles/app.css \
  frontend/app/app.module.js \
  frontend/app/app.routes.js \
  frontend/app/app.run.js \
  frontend/app/app.constants.js \
  frontend/app/main.controller.js
```

### Add CDN dependencies in `frontend/index.html`
- AngularJS `1.8.3`
- `angular-route`
- SignalR browser client
- Bootstrap + FontAwesome for styling

## Notes
- JWT is stored in `localStorage` under `hc_jwt`.
- All API requests include `Authorization: Bearer <token>` via the HTTP interceptor.
- `API_BASE_URL` is set to `/api` for Nginx proxying. If you bypass Nginx, set it to `https://api.hireconnect.com/api`.
