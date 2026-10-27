# Restock

A demo app for a retail shop: staff tell the manager what's running low, and the manager marks requests as seen and ordered. Both sides get notifications.

- **api/**: ASP.NET Core 8 minimal API, EF Core with SQLite, cookie login
- **web/**: Angular 22 with Angular Material, installable as a PWA

The database is created and filled with demo data the first time the API starts.

## Demo logins

| Username | Password | Role |
|---|---|---|
| `manager` | `manager123` | Manager (Sarah Byrne) |
| `aoife` | `staff123` | Staff (Aoife Murphy) |
| `conor` | `staff123` | Staff (Conor Walsh) |

## Run locally

You need the .NET 8 SDK and Node.js 22.22 or newer.

**API** (http://localhost:5080, Swagger at `/swagger`):

```bash
cd api
dotnet run --launch-profile http
```

**Web** (http://localhost:4200, calls to `/api` are forwarded to the API):

```bash
cd web
npm install
npm start
```

To reset the demo data, stop the API, delete `api/shoporders.db` and start it again.

## Run with Docker

```bash
docker build -t restock .
docker run -p 8080:8080 restock
```

Open http://localhost:8080.

## Deploy to Render (free)

1. Push this repo to GitHub.
2. In Render, choose **New → Web Service**, pick the repo, and set **Language** to **Docker**.
3. Pick the **Free** instance type and create the service.

Render builds the Dockerfile and gives you an `onrender.com` URL. On the free plan the service sleeps after 15 minutes without visitors and takes about a minute to wake, so open it shortly before a demo. The database resets whenever the service restarts.

## Notes

- Notifications are fetched every 15 seconds and whenever the app comes back into focus.
- The service worker (offline support) is only active in production builds.
