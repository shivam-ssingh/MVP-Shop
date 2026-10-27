using Microsoft.EntityFrameworkCore;
using ShopOrders.Api.Data;
using ShopOrders.Api.Dtos;

namespace ShopOrders.Api.Endpoints;

public static class CatalogueEndpoints
{
    public static void MapCatalogueEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/categories", async (AppDbContext db) =>
            await db.Categories
                .OrderBy(c => c.SortOrder)
                .Select(c => new CategoryDto(c.Id, c.Name, c.Icon, c.Products.Count))
                .ToListAsync())
            .WithTags("Catalogue")
            .RequireAuthorization();

        // Search used by the "add item" box. Returns at most 20 matches.
        app.MapGet("/api/products", async (int? categoryId, string? q, AppDbContext db) =>
        {
            var query = db.Products.AsQueryable();

            if (categoryId is not null)
                query = query.Where(p => p.CategoryId == categoryId);

            if (!string.IsNullOrWhiteSpace(q))
            {
                // SQLite LIKE is case-insensitive for ASCII, which is fine for product names.
                var pattern = $"%{q.Trim()}%";
                query = query.Where(p => EF.Functions.Like(p.Name, pattern));
            }

            return await query
                .OrderBy(p => p.Name)
                .Take(20)
                .Select(p => new ProductDto(p.Id, p.Name, p.Size, p.CategoryId))
                .ToListAsync();
        })
        .WithTags("Catalogue")
        .RequireAuthorization();
    }
}
