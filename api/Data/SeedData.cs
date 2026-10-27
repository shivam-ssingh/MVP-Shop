using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ShopOrders.Api.Models;

namespace ShopOrders.Api.Data;

public static class SeedData
{
    // Demo logins (also listed in the README).
    public const string ManagerPassword = "manager123";
    public const string StaffPassword = "staff123";

    public static async Task InitialiseAsync(AppDbContext db)
    {
        await db.Database.EnsureCreatedAsync();

        if (await db.Users.AnyAsync())
            return; // already seeded

        var hasher = new PasswordHasher<User>();
        User NewUser(string name, string username, Role role, string password)
        {
            var user = new User { Name = name, Username = username, Role = role };
            user.PasswordHash = hasher.HashPassword(user, password);
            return user;
        }

        var manager = NewUser("Berk", "manager", Role.Manager, ManagerPassword);
        var aoife = NewUser("Shivam", "shivam", Role.Staff, StaffPassword);
        var conor = NewUser("Sameer", "sameer", Role.Staff, StaffPassword);
        db.Users.AddRange(manager, aoife, conor);

        var categories = new[]
        {
            new Category { Name = "Big Drinks",   Icon = "water_drop",      SortOrder = 1 },
            new Category { Name = "Small Drinks", Icon = "local_drink",     SortOrder = 2 },
            new Category { Name = "Big Crisps",   Icon = "fastfood",        SortOrder = 3 },
            new Category { Name = "Small Crisps", Icon = "cookie",          SortOrder = 4 },
            new Category { Name = "Grocery",      Icon = "shopping_basket", SortOrder = 5 },
            new Category { Name = "Off Licence",  Icon = "wine_bar",        SortOrder = 6 },
        };
        db.Categories.AddRange(categories);
        var smallDrinks = categories[1];

        (string Name, string Size)[] smallDrinkProducts =
        {
            ("Coca-Cola", "500ml"),
            ("Coca-Cola Zero Sugar", "500ml"),
            ("Diet Coke", "500ml"),
            ("Coca-Cola Can", "330ml"),
            ("Pepsi Max", "500ml"),
            ("Fanta Orange", "500ml"),
            ("Fanta Lemon", "500ml"),
            ("Sprite Zero", "500ml"),
            ("7UP", "500ml"),
            ("Dr Pepper", "500ml"),
            ("Club Orange", "500ml"),
            ("Club Zero Orange", "500ml"),
            ("Club Lemon", "500ml"),
            ("Club Rock Shandy", "500ml"),
            ("Lucozade Energy Original", "380ml"),
            ("Lucozade Sport Orange", "500ml"),
            ("Red Bull", "250ml"),
            ("Red Bull Sugarfree", "250ml"),
            ("Monster Energy", "500ml"),
            ("Monster Ultra White", "500ml"),
            ("Ballygowan Still Water", "500ml"),
            ("Ballygowan Sparkling Water", "500ml"),
            ("Deep RiverRock Still Water", "500ml"),
            ("Lipton Ice Tea Peach", "500ml"),
            ("Ribena Blackcurrant", "500ml"),
            ("Capri-Sun Orange", "200ml"),
        };
        var products = smallDrinkProducts
            .Select(p => new Product { Name = p.Name, Size = p.Size, Category = smallDrinks })
            .ToList();
        db.Products.AddRange(products);

        Product P(string name) => products.First(p => p.Name == name);
        var now = DateTime.UtcNow;

        // 1. Aoife, two days ago, already ordered.
        var ordered = new OrderRequest
        {
            Staff = aoife, Category = smallDrinks, Status = RequestStatus.Ordered,
            CreatedAt = now.AddDays(-2), SeenAt = now.AddDays(-2).AddHours(1), OrderedAt = now.AddDays(-1).AddHours(-20),
            Items =
            {
                new OrderRequestItem { Product = P("Coca-Cola"), QtyLeft = 3 },
                new OrderRequestItem { Product = P("Red Bull"), QtyLeft = 0, Note = "Sold out since lunch" },
                new OrderRequestItem { Product = P("Club Orange"), QtyLeft = 4 },
            }
        };

        // 2. Conor, yesterday, seen by the manager.
        var seen = new OrderRequest
        {
            Staff = conor, Category = smallDrinks, Status = RequestStatus.Seen,
            CreatedAt = now.AddDays(-1), SeenAt = now.AddHours(-20),
            Items =
            {
                new OrderRequestItem { Product = P("Lucozade Sport Orange"), QtyLeft = 2 },
                new OrderRequestItem { Product = P("Ballygowan Still Water"), QtyLeft = 6 },
                new OrderRequestItem { Product = P("Monster Energy"), QtyLeft = 1 },
                new OrderRequestItem { Product = P("Pepsi Max"), QtyLeft = 5 },
            }
        };

        // 3. Aoife, an hour ago, not opened yet (includes a free-text item).
        var submitted = new OrderRequest
        {
            Staff = aoife, Category = smallDrinks, Status = RequestStatus.Submitted,
            CreatedAt = now.AddHours(-1), Note = "Fridge 2 is nearly empty",
            Items =
            {
                new OrderRequestItem { Product = P("Diet Coke"), QtyLeft = 2 },
                new OrderRequestItem { Product = P("Fanta Orange"), QtyLeft = 1 },
                new OrderRequestItem { Product = P("Red Bull Sugarfree"), QtyLeft = 0 },
                new OrderRequestItem { FreeTextName = "Tropical Vibes 500ml", QtyLeft = 0, Note = "Customers keep asking" },
            }
        };
        db.OrderRequests.AddRange(ordered, seen, submitted);

        db.Notifications.AddRange(
            new Notification
            {
                User = manager, Type = NotificationType.NewRequest, OrderRequest = ordered, IsRead = true,
                Message = "New Small Drinks request from Shivam (3 items)", CreatedAt = ordered.CreatedAt
            },
            new Notification
            {
                User = manager, Type = NotificationType.NewRequest, OrderRequest = seen, IsRead = true,
                Message = "New Small Drinks request from Sameer (4 items)", CreatedAt = seen.CreatedAt
            },
            new Notification
            {
                User = manager, Type = NotificationType.NewRequest, OrderRequest = submitted, IsRead = false,
                Message = "New Small Drinks request from Shivam (4 items)", CreatedAt = submitted.CreatedAt
            },
            new Notification
            {
                User = aoife, Type = NotificationType.RequestSeen, OrderRequest = ordered, IsRead = true,
                Message = "Your Small Drinks request was seen by Berk", CreatedAt = ordered.SeenAt!.Value
            },
            new Notification
            {
                User = aoife, Type = NotificationType.RequestOrdered, OrderRequest = ordered, IsRead = false,
                Message = "Your Small Drinks request was marked as ordered", CreatedAt = ordered.OrderedAt!.Value
            },
            new Notification
            {
                User = conor, Type = NotificationType.RequestSeen, OrderRequest = seen, IsRead = false,
                Message = "Your Small Drinks request was seen by Berk", CreatedAt = seen.SeenAt!.Value
            });

        await db.SaveChangesAsync();
    }
}
