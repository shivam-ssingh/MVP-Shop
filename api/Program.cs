using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using ShopOrders.Api.Data;
using ShopOrders.Api.Endpoints;
using ShopOrders.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Database: one SQLite file. Override with the ConnectionStrings__Default env var.
builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseSqlite(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddScoped<NotificationService>();

// Cookie login. The Angular app is served from the same origin, so the browser
// sends the cookie automatically; no tokens to store on the client.
builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.Cookie.Name = "shoporders.auth";
        o.Cookie.HttpOnly = true;
        o.Cookie.SameSite = SameSiteMode.Strict;
        o.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest; // HTTPS in production, plain HTTP locally
        o.ExpireTimeSpan = TimeSpan.FromDays(7);
        o.SlidingExpiration = true;

        // This is an API: answer 401/403 instead of redirecting to a login page.
        o.Events.OnRedirectToLogin = ctx => { ctx.Response.StatusCode = StatusCodes.Status401Unauthorized; return Task.CompletedTask; };
        o.Events.OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = StatusCodes.Status403Forbidden; return Task.CompletedTask; };
    });
builder.Services.AddAuthorization();

// Enums as strings in JSON ("Submitted", not 0).
builder.Services.ConfigureHttpJsonOptions(o =>
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// Render and Azure terminate HTTPS in front of the app. Trust their X-Forwarded-* headers
// so the app knows the original request was HTTPS (and marks the login cookie Secure).
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownNetworks.Clear();
    o.KnownProxies.Clear();
});

builder.Services.AddProblemDetails();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Create the database and seed demo data on startup.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await SeedData.InitialiseAsync(db);
}

app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseExceptionHandler();
}

// Serves the built Angular app from wwwroot (added in the UI step).
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapAuthEndpoints();
app.MapCatalogueEndpoints();
app.MapOrderRequestEndpoints();
app.MapNotificationEndpoints();

// Unknown /api routes return 404; every other path goes to the Angular app.
app.Map("/api/{**rest}", () => Results.NotFound());
app.MapFallbackToFile("index.html");

app.Run();
