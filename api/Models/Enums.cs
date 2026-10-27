namespace ShopOrders.Api.Models;

public enum Role
{
    Staff,
    Manager
}

public enum RequestStatus
{
    Submitted,
    Seen,
    Ordered
}

public enum NotificationType
{
    NewRequest,
    RequestSeen,
    RequestOrdered
}
