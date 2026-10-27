using Microsoft.EntityFrameworkCore;
using ShopOrders.Api.Data;
using ShopOrders.Api.Models;

namespace ShopOrders.Api.Services;

/// <summary>
/// Adds notification rows to the context. The caller saves, so the request
/// change and its notifications are written in one SaveChanges call.
/// </summary>
public class NotificationService(AppDbContext db)
{
    public async Task NotifyNewRequestAsync(OrderRequest request, string staffName, string categoryName)
    {
        var managerIds = await db.Users
            .Where(u => u.Role == Role.Manager)
            .Select(u => u.Id)
            .ToListAsync();

        var itemWord = request.Items.Count == 1 ? "item" : "items";
        foreach (var managerId in managerIds)
        {
            db.Notifications.Add(new Notification
            {
                UserId = managerId,
                Type = NotificationType.NewRequest,
                OrderRequest = request,
                Message = $"New {categoryName} request from {staffName} ({request.Items.Count} {itemWord})",
            });
        }
    }

    public void NotifySeen(OrderRequest request, string managerName) =>
        db.Notifications.Add(new Notification
        {
            UserId = request.StaffId,
            Type = NotificationType.RequestSeen,
            OrderRequestId = request.Id,
            Message = $"Your {request.Category.Name} request was seen by {managerName}",
        });

    public void NotifyOrdered(OrderRequest request) =>
        db.Notifications.Add(new Notification
        {
            UserId = request.StaffId,
            Type = NotificationType.RequestOrdered,
            OrderRequestId = request.Id,
            Message = $"Your {request.Category.Name} request was marked as ordered",
        });
}
