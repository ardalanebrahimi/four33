namespace Four33.Api.DTOs;

// Request DTOs
public record TrackPlayRequest(
    Guid RecordingId,
    int DurationListened,
    int CompletedPercent,
    string? Source
);

public record TrackViewRequest(
    string PageType,
    string PageId,
    string? Source
);

public record TrackSearchRequest(
    string Query,
    int ResultsCount,
    Guid? ClickedResultId
);

// Response DTOs
public record PopularRecordingDto(
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

public record PopularTagDto(
    Guid Id,
    string Name,
    int RecordingCount,
    int PlayCount,
    bool IsFollowing
);

public record PopularUserDto(
    Guid Id,
    string Username,
    string? AvatarUrl,
    int RecordingsCount,
    int TotalPlays,
    int FollowersCount,
    bool IsFollowing
);

public record TrendDataPointDto(
    DateTime Date,
    int Count
);

public record RecordingTrendsDto(
    Guid RecordingId,
    string? Title,
    int TotalPlays,
    List<TrendDataPointDto> DailyPlays
);

public record OverviewStatsDto(
    int TotalRecordings,
    int TotalPlays,
    int TotalUsers,
    int TotalTags,
    int PlaysToday,
    int PlaysThisWeek,
    int PlaysThisMonth,
    int NewRecordingsToday,
    int NewRecordingsThisWeek,
    int NewUsersThisWeek
);

public record PlatformTrendsDto(
    List<TrendDataPointDto> DailyPlays,
    List<TrendDataPointDto> DailyRecordings,
    List<TrendDataPointDto> DailyUsers
);
