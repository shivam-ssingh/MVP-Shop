namespace ShopOrders.Api.Models;

public class Notification
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public NotificationType Type { get; set; }

    public int OrderRequestId { get; set; }
    public OrderRequest OrderRequest { get; set; } = null!;

    public string Message { get; set; } = "";
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
