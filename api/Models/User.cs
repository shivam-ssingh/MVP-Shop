namespace ShopOrders.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Username { get; set; } = "";   // stored lowercase
    public string PasswordHash { get; set; } = "";
    public Role Role { get; set; }
}
