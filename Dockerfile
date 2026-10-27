# One image: the Angular app is built, then served by the .NET API from wwwroot.

# ---- 1. Build the Angular app --------------------------------------------------
FROM node:22-alpine AS web
WORKDIR /src/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npx ng build

# ---- 2. Publish the .NET API ---------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS api
WORKDIR /src/api
COPY api/ShopOrders.Api.csproj ./
RUN dotnet restore
COPY api/ ./
RUN dotnet publish -c Release -o /app --no-restore

# ---- 3. Runtime ----------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=api /app ./
COPY --from=web /src/web/dist/web/browser ./wwwroot

# SQLite file lives in /app/data (writable by the non-root "app" user).
RUN mkdir -p /app/data && chown -R $APP_UID /app/data
ENV ConnectionStrings__Default="Data Source=/app/data/shoporders.db"

USER $APP_UID
EXPOSE 8080

# Render sets PORT; locally it defaults to 8080.
ENTRYPOINT ["sh", "-c", "ASPNETCORE_HTTP_PORTS=${PORT:-8080} exec dotnet ShopOrders.Api.dll"]
