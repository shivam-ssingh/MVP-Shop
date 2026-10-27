using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using ShopOrders.Api.Models;

namespace ShopOrders.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<OrderRequest> OrderRequests => Set<OrderRequest>();
    public DbSet<OrderRequestItem> OrderRequestItems => Set<OrderRequestItem>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>().HasIndex(u => u.Username).IsUnique();
        b.Entity<User>().Property(u => u.Role).HasConversion<string>();

        b.Entity<OrderRequest>().Property(r => r.Status).HasConversion<string>();
        b.Entity<Notification>().Property(n => n.Type).HasConversion<string>();

        b.Entity<OrderRequest>()
            .HasOne(r => r.Staff).WithMany()
            .HasForeignKey(r => r.StaffId)
            .OnDelete(DeleteBehavior.Restrict);

        b.Entity<Notification>()
            .HasOne(n => n.User).WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<Notification>().HasIndex(n => new { n.UserId, n.IsRead });

        // SQLite has no date type and forgets that values were UTC.
        // Mark them as UTC on the way out so JSON gets a trailing "Z".
        // (EF never passes nulls to converters, so one converter covers DateTime? too.)
        var utc = new ValueConverter<DateTime, DateTime>(
            v => v.ToUniversalTime(),
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

        foreach (var entity in b.Model.GetEntityTypes())
        foreach (var property in entity.GetProperties())
        {
            if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?))
                property.SetValueConverter(utc);
        }
    }
}
