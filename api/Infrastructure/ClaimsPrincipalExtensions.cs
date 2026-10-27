using System.Security.Claims;
using ShopOrders.Api.Models;

namespace ShopOrders.Api.Infrastructure;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user) =>
        int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? throw new InvalidOperationException("User is not signed in."));

    public static bool IsManager(this ClaimsPrincipal user) =>
        user.IsInRole(nameof(Role.Manager));
}
