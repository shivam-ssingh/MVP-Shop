namespace ShopOrders.Api.Models;

public class OrderRequestItem
{
    public int Id { get; set; }

    public int OrderRequestId { get; set; }
    public OrderRequest OrderRequest { get; set; } = null!;

    // Either a product from the catalogue...
    public int? ProductId { get; set; }
    public Product? Product { get; set; }

    // ...or a name typed by staff when the product isn't in the system.
    public string? FreeTextName { get; set; }

    public int QtyLeft { get; set; }
    public string? Note { get; set; }
}
