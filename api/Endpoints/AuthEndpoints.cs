using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ShopOrders.Api.Data;
using ShopOrders.Api.Dtos;
using ShopOrders.Api.Infrastructure;
using ShopOrders.Api.Models;

namespace ShopOrders.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/login", async (LoginRequest body, AppDbContext db, HttpContext http) =>
        {
            var username = (body.Username ?? "").Trim().ToLowerInvariant();
            var user = await db.Users.SingleOrDefaultAsync(u => u.Username == username);
            if (user is null)
                return Results.Problem("Incorrect username or password.", statusCode: StatusCodes.Status401Unauthorized);

            var result = new PasswordHasher<User>().VerifyHashedPassword(user, user.PasswordHash, body.Password ?? "");
            if (result == PasswordVerificationResult.Failed)
                return Results.Problem("Incorrect username or password.", statusCode: StatusCodes.Status401Unauthorized);

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Name, user.Name),
                new(ClaimTypes.Role, user.Role.ToString()),
            };
            var principal = new ClaimsPrincipal(
                new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme));

            await http.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal,
                new AuthenticationProperties { IsPersistent = true });

            return Results.Ok(ToDto(user));
        });

        group.MapPost("/logout", async (HttpContext http) =>
        {
            await http.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.NoContent();
        });

        group.MapGet("/me", async (ClaimsPrincipal principal, AppDbContext db) =>
        {
            var user = await db.Users.FindAsync(principal.GetUserId());
            // The cookie can outlive the user row (e.g. the demo DB was reset).
            return user is null ? Results.Unauthorized() : Results.Ok(ToDto(user));
        }).RequireAuthorization();
    }

    private static UserDto ToDto(User u) => new(u.Id, u.Name, u.Username, u.Role);
}
