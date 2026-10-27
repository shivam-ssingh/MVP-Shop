using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using ShopOrders.Api.Data;
using ShopOrders.Api.Dtos;
using ShopOrders.Api.Infrastructure;
using ShopOrders.Api.Models;
using ShopOrders.Api.Services;

namespace ShopOrders.Api.Endpoints;

public static class OrderRequestEndpoints
{
    public static void MapOrderRequestEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/order-requests")
            .WithTags("Order requests")
            .RequireAuthorization();

        // Staff: submit a new request.
        group.MapPost("/", async (CreateOrderRequest body, ClaimsPrincipal user,
                                  AppDbContext db, NotificationService notifications) =>
        {
            var errors = Validate(body);
            if (errors.Count > 0)
                return Results.ValidationProblem(errors);

            var category = await db.Categories.FindAsync(body.CategoryId);
            if (category is null)
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["categoryId"] = ["Category not found."]
                });

            var productIds = body.Items.Where(i => i.ProductId is not null).Select(i => i.ProductId!.Value).Distinct().ToList();
            var foundIds = await db.Products.Where(p => productIds.Contains(p.Id)).Select(p => p.Id).ToListAsync();
            var missing = productIds.Except(foundIds).ToList();
            if (missing.Count > 0)
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["items"] = [$"Unknown product id(s): {string.Join(", ", missing)}"]
                });

            var staffId = user.GetUserId();
            var staffName = user.Identity!.Name!;

            var request = new OrderRequest
            {
                StaffId = staffId,
                CategoryId = category.Id,
                Note = Clean(body.Note),
                Items = body.Items.Select(i => new OrderRequestItem
                {
                    ProductId = i.ProductId,
                    FreeTextName = i.ProductId is null ? Clean(i.FreeTextName) : null,
                    QtyLeft = i.QtyLeft,
                    Note = Clean(i.Note),
                }).ToList(),
            };
            db.OrderRequests.Add(request);
            await notifications.NotifyNewRequestAsync(request, staffName, category.Name);
            await db.SaveChangesAsync();

            var summary = new OrderRequestSummaryDto(request.Id, staffName, category.Id, category.Name, category.Icon,
                request.Status, request.Items.Count, request.CreatedAt, null, null);
            return Results.Created($"/api/order-requests/{request.Id}", summary);
        })
        .RequireAuthorization(p => p.RequireRole(nameof(Role.Staff)));

        // Staff: my own requests, newest first.
        group.MapGet("/mine", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var staffId = user.GetUserId();
            return await Summaries(db.OrderRequests.Where(r => r.StaffId == staffId));
        })
        .RequireAuthorization(p => p.RequireRole(nameof(Role.Staff)));

        // Manager: all requests, optionally filtered by status (?status=Submitted).
        group.MapGet("/", async (RequestStatus? status, AppDbContext db) =>
        {
            var query = db.OrderRequests.AsQueryable();
            if (status is not null)
                query = query.Where(r => r.Status == status);
            return await Summaries(query);
        })
        .RequireAuthorization(p => p.RequireRole(nameof(Role.Manager)));

        // Both roles: request detail. Staff may only open their own.
        // When the manager opens a Submitted request it becomes Seen and the staff member is notified.
        group.MapGet("/{id:int}", async (int id, ClaimsPrincipal user, AppDbContext db, NotificationService notifications) =>
        {
            var request = await db.OrderRequests
                .Include(r => r.Staff)
                .Include(r => r.Category)
                .Include(r => r.Items).ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request is null)
                return Results.NotFound();

            var userId = user.GetUserId();
            var isManager = user.IsManager();
            if (!isManager && request.StaffId != userId)
                return Results.NotFound(); // don't reveal other people's requests

            if (isManager && request.Status == RequestStatus.Submitted)
            {
                request.Status = RequestStatus.Seen;
                request.SeenAt = DateTime.UtcNow;
                notifications.NotifySeen(request, user.Identity!.Name!);
            }

            // Opening a request clears this user's unread notifications about it.
            var unread = await db.Notifications
                .Where(n => n.UserId == userId && n.OrderRequestId == id && !n.IsRead)
                .ToListAsync();
            unread.ForEach(n => n.IsRead = true);

            await db.SaveChangesAsync();
            return Results.Ok(ToDetail(request));
        });

        // Manager: move a request forward (Seen -> Ordered). Status never goes backwards.
        group.MapPatch("/{id:int}/status", async (int id, UpdateStatusRequest body, ClaimsPrincipal user,
                                                  AppDbContext db, NotificationService notifications) =>
        {
            var request = await db.OrderRequests
                .Include(r => r.Staff)
                .Include(r => r.Category)
                .Include(r => r.Items).ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request is null)
                return Results.NotFound();

            if (body.Status <= request.Status)
                return Results.Problem($"Request is already {request.Status}.", statusCode: StatusCodes.Status409Conflict);

            var now = DateTime.UtcNow;
            if (request.Status == RequestStatus.Submitted)
            {
                // Skipping straight to Ordered still counts as seen.
                request.SeenAt = now;
                if (body.Status == RequestStatus.Seen)
                    notifications.NotifySeen(request, user.Identity!.Name!);
            }

            request.Status = body.Status;
            if (body.Status == RequestStatus.Ordered)
            {
                request.OrderedAt = now;
                notifications.NotifyOrdered(request);
            }

            await db.SaveChangesAsync();
            return Results.Ok(ToDetail(request));
        })
        .RequireAuthorization(p => p.RequireRole(nameof(Role.Manager)));
    }

    private static Task<List<OrderRequestSummaryDto>> Summaries(IQueryable<OrderRequest> query) =>
        query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new OrderRequestSummaryDto(
                r.Id, r.Staff.Name, r.CategoryId, r.Category.Name, r.Category.Icon,
                r.Status, r.Items.Count, r.CreatedAt, r.SeenAt, r.OrderedAt))
            .ToListAsync();

    private static OrderRequestDetailDto ToDetail(OrderRequest r) => new(
        r.Id, r.Staff.Name, r.CategoryId, r.Category.Name, r.Category.Icon,
        r.Status, r.Note, r.CreatedAt, r.SeenAt, r.OrderedAt,
        r.Items
            .OrderBy(i => i.Id)
            .Select(i => new OrderRequestItemDto(
                i.Id,
                i.ProductId,
                i.Product?.Name ?? i.FreeTextName ?? "(unnamed)",
                i.Product?.Size,
                i.ProductId is null,
                i.QtyLeft,
                i.Note))
            .ToList());

    private static Dictionary<string, string[]> Validate(CreateOrderRequest body)
    {
        var errors = new Dictionary<string, string[]>();

        if (body.Items is null || body.Items.Count == 0)
        {
            errors["items"] = ["Add at least one item."];
            return errors;
        }
        if (body.Items.Count > 100)
            errors["items"] = ["A request can have at most 100 items."];

        for (var i = 0; i < body.Items.Count; i++)
        {
            var item = body.Items[i];
            if (item.ProductId is null && string.IsNullOrWhiteSpace(item.FreeTextName))
                errors[$"items[{i}]"] = ["Pick a product or type a product name."];
            else if (item.QtyLeft is < 0 or > 9999)
                errors[$"items[{i}].qtyLeft"] = ["Quantity left must be between 0 and 9999."];
        }
        if (body.Note?.Length > 500)
            errors["note"] = ["Note must be 500 characters or fewer."];

        return errors;
    }

    private static string? Clean(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();
}
