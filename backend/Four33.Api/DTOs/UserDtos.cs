namespace Four33.Api.DTOs;

public record UserSummaryDto(
    Guid Id,
    string Username,
    int FollowersCount,
    int FollowingCount,
    int RecordingsCount,
    bool? IsFollowing
);

public record UserProfileDto(
    Guid Id,
    string Username,
    string Email,
    int FollowersCount,
    int FollowingCount,
    int RecordingsCount,
    bool? IsFollowing,
    DateTime CreatedAt,
    bool IsAdmin = false,
    int InvitesRemaining = 0
);

public record UpdateUserRequest(
    string? Username
);
