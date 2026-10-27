namespace ShopOrders.Api.Models;

public class OrderRequest
{
    public int Id { get; set; }

    public int StaffId { get; set; }
    public User Staff { get; set; } = null!;

    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public RequestStatus Status { get; set; } = RequestStatus.Submitted;
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SeenAt { get; set; }
    public DateTime? OrderedAt { get; set; }

    public List<OrderRequestItem> Items { get; set; } = new();
}
