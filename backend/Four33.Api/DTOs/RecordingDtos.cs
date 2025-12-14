namespace Four33.Api.DTOs;

public record RecordingDto(
    Guid Id,
    UserSummaryDto User,
    string Movement,
    int DurationSeconds,
    string AudioUrl,
    int[] WaveformData,
    List<TagDto> Tags,
    string? Title,
    int LikesCount,
    int PlayCount,
    bool IsLiked,
    List<UserSummaryDto>? LikedByUsers,
    DateTime CreatedAt,
    string TimeAgo
);

public record RecordingListDto(
    Guid Id,
    UserSummaryDto User,
    string Movement,
    int DurationSeconds,
    string AudioUrl,
    int[] WaveformData,
    List<TagDto> Tags,
    string? Title,
    int LikesCount,
    int PlayCount,
    bool IsLiked,
    DateTime CreatedAt,
    string TimeAgo
);

public record CreateRecordingRequest(
    string Movement,
    int DurationSeconds,
    int[]? WaveformData,
    List<string> Tags,
    string? Title
);

public record AddTagRequest(string TagName);

public record RecordingFilter(
    string? Tag = null,
    Guid? UserId = null,
    string? Movement = null,
    bool FollowingOnly = false,
    int Limit = 20,
    int Offset = 0
);
