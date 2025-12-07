namespace Four33.Api.DTOs;

public record ActivityDto(
    Guid Id,
    string Type, // "like", "follow", "tag"
    UserSummaryDto User,
    RecordingListDto? Recording,
    string? Tag,
    DateTime CreatedAt,
    string TimeAgo
);

public record PaginatedResult<T>(
    List<T> Items,
    int TotalCount,
    bool HasMore,
    int Offset,
    int Limit
);
