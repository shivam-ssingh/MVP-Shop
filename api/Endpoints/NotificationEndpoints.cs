using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using ShopOrders.Api.Data;
using ShopOrders.Api.Dtos;
using ShopOrders.Api.Infrastructure;

namespace ShopOrders.Api.Endpoints;

public static class NotificationEndpoints
{
    public static void MapNotificationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/notifications")
            .WithTags("Notifications")
            .RequireAuthorization();

        // Polled by the bell every 15 seconds: unread count + latest 20.
        group.MapGet("/", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = user.GetUserId();
            var mine = db.Notifications.Where(n => n.UserId == userId);

            var unreadCount = await mine.CountAsync(n => !n.IsRead);
            var items = await mine
                .OrderByDescending(n => n.CreatedAt)
                .Take(20)
                .Select(n => new NotificationDto(n.Id, n.Type, n.Message, n.OrderRequestId, n.IsRead, n.CreatedAt))
                .ToListAsync();

            return new NotificationListDto(unreadCount, items);
        });

        group.MapPost("/{id:int}/read", async (int id, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = user.GetUserId();
            var notification = await db.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
            if (notification is null)
                return Results.NotFound();

            notification.IsRead = true;
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        group.MapPost("/read-all", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = user.GetUserId();
            var unread = await db.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
            unread.ForEach(n => n.IsRead = true);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
