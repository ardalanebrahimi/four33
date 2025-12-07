using Four33.Api.Data.Entities;
using Four33.Api.DTOs;

namespace Four33.Api.Services;

public static class MappingExtensions
{
    public static UserSummaryDto ToSummaryDto(this User user, Guid? currentUserId = null)
    {
        return new UserSummaryDto(
            Id: user.Id,
            Username: user.Username,
            FollowersCount: user.Followers.Count,
            FollowingCount: user.Following.Count,
            RecordingsCount: user.Recordings.Count,
            IsFollowing: currentUserId.HasValue
                ? user.Followers.Any(f => f.FollowerId == currentUserId)
                : null
        );
    }

    public static UserProfileDto ToProfileDto(this User user, Guid? currentUserId = null)
    {
        return new UserProfileDto(
            Id: user.Id,
            Username: user.Username,
            Email: user.Email,
            FollowersCount: user.Followers.Count,
            FollowingCount: user.Following.Count,
            RecordingsCount: user.Recordings.Count,
            IsFollowing: currentUserId.HasValue && currentUserId != user.Id
                ? user.Followers.Any(f => f.FollowerId == currentUserId)
                : null,
            CreatedAt: user.CreatedAt
        );
    }

    public static TagDto ToDto(this RecordingTag rt, Guid? currentUserId = null)
    {
        return new TagDto(
            Id: rt.Tag.Id,
            Name: rt.Tag.Name,
            RecordingCount: rt.Tag.RecordingTags.Count,
            IsFollowing: currentUserId.HasValue
                ? rt.Tag.Followers.Any(f => f.UserId == currentUserId)
                : null,
            IsOriginal: rt.IsOriginal
        );
    }

    public static TagListDto ToListDto(this Tag tag, Guid? currentUserId = null)
    {
        return new TagListDto(
            Id: tag.Id,
            Name: tag.Name,
            RecordingCount: tag.RecordingTags.Count,
            IsFollowing: currentUserId.HasValue && tag.Followers.Any(f => f.UserId == currentUserId)
        );
    }

    public static TagDetailDto ToDetailDto(this Tag tag, Guid? currentUserId = null)
    {
        return new TagDetailDto(
            Id: tag.Id,
            Name: tag.Name,
            RecordingCount: tag.RecordingTags.Count,
            IsFollowing: currentUserId.HasValue && tag.Followers.Any(f => f.UserId == currentUserId),
            CreatedAt: tag.CreatedAt
        );
    }

    public static RecordingDto ToDto(this Recording recording, Guid? currentUserId = null)
    {
        return new RecordingDto(
            Id: recording.Id,
            User: recording.User.ToSummaryDto(currentUserId),
            Movement: recording.Movement,
            DurationSeconds: recording.DurationSeconds,
            AudioUrl: recording.AudioBlobUrl,
            WaveformData: recording.WaveformData,
            Tags: recording.Tags.Select(t => t.ToDto(currentUserId)).ToList(),
            Title: recording.Title,
            LikesCount: recording.Likes.Count,
            IsLiked: currentUserId.HasValue && recording.Likes.Any(l => l.UserId == currentUserId),
            LikedByUsers: recording.Likes
                .OrderByDescending(l => l.CreatedAt)
                .Take(3)
                .Select(l => l.User.ToSummaryDto(currentUserId))
                .ToList(),
            CreatedAt: recording.CreatedAt,
            TimeAgo: GetTimeAgo(recording.CreatedAt)
        );
    }

    public static RecordingListDto ToListDto(this Recording recording, Guid? currentUserId = null)
    {
        return new RecordingListDto(
            Id: recording.Id,
            User: recording.User.ToSummaryDto(currentUserId),
            Movement: recording.Movement,
            DurationSeconds: recording.DurationSeconds,
            AudioUrl: recording.AudioBlobUrl,
            WaveformData: recording.WaveformData,
            Tags: recording.Tags.Select(t => t.ToDto(currentUserId)).ToList(),
            Title: recording.Title,
            LikesCount: recording.Likes.Count,
            IsLiked: currentUserId.HasValue && recording.Likes.Any(l => l.UserId == currentUserId),
            CreatedAt: recording.CreatedAt,
            TimeAgo: GetTimeAgo(recording.CreatedAt)
        );
    }

    private static string GetTimeAgo(DateTime dateTime)
    {
        var span = DateTime.UtcNow - dateTime;

        if (span.TotalMinutes < 1)
            return "just now";
        if (span.TotalMinutes < 60)
            return $"{(int)span.TotalMinutes}m ago";
        if (span.TotalHours < 24)
            return $"{(int)span.TotalHours}h ago";
        if (span.TotalDays < 7)
            return $"{(int)span.TotalDays}d ago";
        if (span.TotalDays < 30)
            return $"{(int)(span.TotalDays / 7)}w ago";
        if (span.TotalDays < 365)
            return $"{(int)(span.TotalDays / 30)}mo ago";

        return $"{(int)(span.TotalDays / 365)}y ago";
    }
}
