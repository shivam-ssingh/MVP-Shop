using ShopOrders.Api.Models;

namespace ShopOrders.Api.Dtos;

// Auth
public record LoginRequest(string Username, string Password);
public record UserDto(int Id, string Name, string Username, Role Role);

// Catalogue
public record CategoryDto(int Id, string Name, string Icon, int ProductCount);
public record ProductDto(int Id, string Name, string Size, int CategoryId);

// Order requests: input
public record CreateOrderRequestItem(int? ProductId, string? FreeTextName, int QtyLeft, string? Note);
public record CreateOrderRequest(int CategoryId, string? Note, List<CreateOrderRequestItem> Items);
public record UpdateStatusRequest(RequestStatus Status);

// Order requests: output
public record OrderRequestSummaryDto(
    int Id,
    string StaffName,
    int CategoryId,
    string CategoryName,
    string CategoryIcon,
    RequestStatus Status,
    int ItemCount,
    DateTime CreatedAt,
    DateTime? SeenAt,
    DateTime? OrderedAt);

public record OrderRequestItemDto(
    int Id,
    int? ProductId,
    string Name,
    string? Size,
    bool IsFreeText,
    int QtyLeft,
    string? Note);

public record OrderRequestDetailDto(
    int Id,
    string StaffName,
    int CategoryId,
    string CategoryName,
    string CategoryIcon,
    RequestStatus Status,
    string? Note,
    DateTime CreatedAt,
    DateTime? SeenAt,
    DateTime? OrderedAt,
    List<OrderRequestItemDto> Items);

// Notifications
public record NotificationDto(
    int Id,
    NotificationType Type,
    string Message,
    int OrderRequestId,
    bool IsRead,
    DateTime CreatedAt);

public record NotificationListDto(int UnreadCount, List<NotificationDto> Items);
