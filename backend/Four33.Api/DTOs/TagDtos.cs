namespace Four33.Api.DTOs;

public record TagDto(
    Guid Id,
    string Name,
    int? RecordingCount,
    bool? IsFollowing,
    bool IsOriginal
);

public record TagDetailDto(
    Guid Id,
    string Name,
    int RecordingCount,
    bool IsFollowing,
    DateTime CreatedAt
);

public record TagListDto(
    Guid Id,
    string Name,
    int RecordingCount,
    bool IsFollowing
);
