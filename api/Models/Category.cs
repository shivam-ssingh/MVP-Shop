namespace ShopOrders.Api.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Icon { get; set; } = "";       // Material icon name, used by the UI
    public int SortOrder { get; set; }

    public List<Product> Products { get; set; } = new();
}
