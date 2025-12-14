using Four33.Api.Data;
using Four33.Api.Data.Entities;
using Four33.Api.DTOs;
using Four33.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Four33.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AnalyticsController(AppDbContext db)
    {
        _db = db;
    }

    // ==================== TRACKING ENDPOINTS ====================

    [HttpPost("play")]
    public async Task<IActionResult> TrackPlay([FromBody] TrackPlayRequest request)
    {
        var userId = User.GetUserId();

        var recording = await _db.Recordings.FindAsync(request.RecordingId);
        if (recording == null)
            return NotFound(new { error = "Recording not found" });

        // Create play event
        var playEvent = new PlayEvent
        {
            Id = Guid.NewGuid(),
            RecordingId = request.RecordingId,
            UserId = userId,
            DurationListened = request.DurationListened,
            CompletedPercent = request.CompletedPercent,
            Source = request.Source ?? "unknown",
            PlayedAt = DateTime.UtcNow
        };

        _db.PlayEvents.Add(playEvent);

        // Increment play count
        recording.PlayCount++;

        // Update unique listeners if this is a new user for this recording
        if (userId.HasValue)
        {
            var hasPlayedBefore = await _db.PlayEvents
                .AnyAsync(p => p.RecordingId == request.RecordingId && p.UserId == userId && p.Id != playEvent.Id);

            if (!hasPlayedBefore)
            {
                recording.UniqueListeners++;
            }
        }

        await _db.SaveChangesAsync();

        return Ok(new { success = true, playCount = recording.PlayCount });
    }

    [HttpPost("view")]
    public async Task<IActionResult> TrackView([FromBody] TrackViewRequest request)
    {
        var userId = User.GetUserId();

        var viewEvent = new ViewEvent
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PageType = request.PageType,
            PageId = request.PageId,
            Source = request.Source,
            ViewedAt = DateTime.UtcNow
        };

        _db.ViewEvents.Add(viewEvent);
        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }

    [HttpPost("search")]
    public async Task<IActionResult> TrackSearch([FromBody] TrackSearchRequest request)
    {
        var userId = User.GetUserId();

        var searchEvent = new SearchEvent
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Query = request.Query,
            ResultsCount = request.ResultsCount,
            ClickedResultId = request.ClickedResultId,
            SearchedAt = DateTime.UtcNow
        };

        _db.SearchEvents.Add(searchEvent);
        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }

    // ==================== POPULAR ENDPOINTS ====================

    [HttpGet("popular/recordings")]
    public async Task<ActionResult<List<PopularRecordingDto>>> GetPopularRecordings(
        [FromQuery] string period = "week",
        [FromQuery] int limit = 10)
    {
        var currentUserId = User.GetUserId();
        var since = GetDateFromPeriod(period);

        var popularRecordingIds = await _db.PlayEvents
            .Where(p => p.PlayedAt >= since)
            .GroupBy(p => p.RecordingId)
            .Select(g => new { RecordingId = g.Key, PlayCount = g.Count() })
            .OrderByDescending(x => x.PlayCount)
            .Take(limit)
            .Select(x => x.RecordingId)
            .ToListAsync();

        var recordings = await _db.Recordings
            .Include(r => r.User).ThenInclude(u => u.Followers)
            .Include(r => r.User).ThenInclude(u => u.Following)
            .Include(r => r.User).ThenInclude(u => u.Recordings)
            .Include(r => r.Tags).ThenInclude(t => t.Tag).ThenInclude(t => t.Followers)
            .Include(r => r.Tags).ThenInclude(t => t.Tag).ThenInclude(t => t.RecordingTags)
            .Include(r => r.Likes)
            .Where(r => popularRecordingIds.Contains(r.Id))
            .ToListAsync();

        // Sort by the order from the play count query
        var orderedRecordings = popularRecordingIds
            .Select(id => recordings.FirstOrDefault(r => r.Id == id))
            .Where(r => r != null)
            .Select(r => new PopularRecordingDto(
                Id: r!.Id,
                User: r.User.ToSummaryDto(currentUserId),
                Movement: r.Movement,
                DurationSeconds: r.DurationSeconds,
                AudioUrl: r.AudioBlobUrl,
                WaveformData: r.WaveformData ?? [],
                Tags: r.Tags.Select(t => t.ToDto(currentUserId)).ToList(),
                Title: r.Title,
                LikesCount: r.Likes.Count,
                PlayCount: r.PlayCount,
                IsLiked: currentUserId.HasValue && r.Likes.Any(l => l.UserId == currentUserId),
                CreatedAt: r.CreatedAt,
                TimeAgo: GetTimeAgo(r.CreatedAt)
            ))
            .ToList();

        return Ok(orderedRecordings);
    }

    [HttpGet("popular/tags")]
    public async Task<ActionResult<List<PopularTagDto>>> GetPopularTags(
        [FromQuery] string period = "week",
        [FromQuery] int limit = 10)
    {
        var currentUserId = User.GetUserId();
        var since = GetDateFromPeriod(period);

        // Get play counts per tag
        var tagPlayCounts = await _db.PlayEvents
            .Where(p => p.PlayedAt >= since)
            .Join(_db.RecordingTags,
                p => p.RecordingId,
                rt => rt.RecordingId,
                (p, rt) => rt.TagId)
            .GroupBy(tagId => tagId)
            .Select(g => new { TagId = g.Key, PlayCount = g.Count() })
            .OrderByDescending(x => x.PlayCount)
            .Take(limit)
            .ToListAsync();

        var tagIds = tagPlayCounts.Select(t => t.TagId).ToList();

        var tags = await _db.Tags
            .Include(t => t.RecordingTags)
            .Include(t => t.Followers)
            .Where(t => tagIds.Contains(t.Id))
            .ToListAsync();

        var result = tagPlayCounts
            .Select(tc =>
            {
                var tag = tags.FirstOrDefault(t => t.Id == tc.TagId);
                if (tag == null) return null;

                return new PopularTagDto(
                    Id: tag.Id,
                    Name: tag.Name,
                    RecordingCount: tag.RecordingTags.Count,
                    PlayCount: tc.PlayCount,
                    IsFollowing: currentUserId.HasValue && tag.Followers.Any(f => f.UserId == currentUserId)
                );
            })
            .Where(t => t != null)
            .Cast<PopularTagDto>()
            .ToList();

        return Ok(result);
    }

    [HttpGet("popular/users")]
    public async Task<ActionResult<List<PopularUserDto>>> GetPopularUsers(
        [FromQuery] string period = "week",
        [FromQuery] int limit = 10)
    {
        var currentUserId = User.GetUserId();
        var since = GetDateFromPeriod(period);

        // Get play counts per user (recording owner)
        var userPlayCounts = await _db.PlayEvents
            .Where(p => p.PlayedAt >= since)
            .Join(_db.Recordings,
                p => p.RecordingId,
                r => r.Id,
                (p, r) => r.UserId)
            .GroupBy(userId => userId)
            .Select(g => new { UserId = g.Key, PlayCount = g.Count() })
            .OrderByDescending(x => x.PlayCount)
            .Take(limit)
            .ToListAsync();

        var userIds = userPlayCounts.Select(u => u.UserId).ToList();

        var users = await _db.Users
            .Include(u => u.Recordings)
            .Include(u => u.Followers)
            .Include(u => u.Following)
            .Where(u => userIds.Contains(u.Id))
            .ToListAsync();

        var result = userPlayCounts
            .Select(uc =>
            {
                var user = users.FirstOrDefault(u => u.Id == uc.UserId);
                if (user == null) return null;

                return new PopularUserDto(
                    Id: user.Id,
                    Username: user.Username,
                    AvatarUrl: null, // Add avatar support later
                    RecordingsCount: user.Recordings.Count,
                    TotalPlays: uc.PlayCount,
                    FollowersCount: user.Followers.Count,
                    IsFollowing: currentUserId.HasValue && user.Followers.Any(f => f.FollowerId == currentUserId)
                );
            })
            .Where(u => u != null)
            .Cast<PopularUserDto>()
            .ToList();

        return Ok(result);
    }

    // ==================== TRENDS ENDPOINTS ====================

    [HttpGet("trends/recording/{id:guid}")]
    public async Task<ActionResult<RecordingTrendsDto>> GetRecordingTrends(
        Guid id,
        [FromQuery] string period = "month")
    {
        var recording = await _db.Recordings.FindAsync(id);
        if (recording == null)
            return NotFound();

        var since = GetDateFromPeriod(period);

        var dailyPlays = await _db.PlayEvents
            .Where(p => p.RecordingId == id && p.PlayedAt >= since)
            .GroupBy(p => p.PlayedAt.Date)
            .Select(g => new TrendDataPointDto(g.Key, g.Count()))
            .OrderBy(t => t.Date)
            .ToListAsync();

        return Ok(new RecordingTrendsDto(
            RecordingId: id,
            Title: recording.Title,
            TotalPlays: recording.PlayCount,
            DailyPlays: dailyPlays
        ));
    }

    [HttpGet("trends/platform")]
    public async Task<ActionResult<PlatformTrendsDto>> GetPlatformTrends(
        [FromQuery] string period = "month")
    {
        var since = GetDateFromPeriod(period);

        var dailyPlays = await _db.PlayEvents
            .Where(p => p.PlayedAt >= since)
            .GroupBy(p => p.PlayedAt.Date)
            .Select(g => new TrendDataPointDto(g.Key, g.Count()))
            .OrderBy(t => t.Date)
            .ToListAsync();

        var dailyRecordings = await _db.Recordings
            .Where(r => r.CreatedAt >= since)
            .GroupBy(r => r.CreatedAt.Date)
            .Select(g => new TrendDataPointDto(g.Key, g.Count()))
            .OrderBy(t => t.Date)
            .ToListAsync();

        var dailyUsers = await _db.Users
            .Where(u => u.CreatedAt >= since)
            .GroupBy(u => u.CreatedAt.Date)
            .Select(g => new TrendDataPointDto(g.Key, g.Count()))
            .OrderBy(t => t.Date)
            .ToListAsync();

        return Ok(new PlatformTrendsDto(
            DailyPlays: dailyPlays,
            DailyRecordings: dailyRecordings,
            DailyUsers: dailyUsers
        ));
    }

    [HttpGet("overview")]
    public async Task<ActionResult<OverviewStatsDto>> GetOverviewStats()
    {
        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var weekStart = now.AddDays(-7);
        var monthStart = now.AddDays(-30);

        var totalRecordings = await _db.Recordings.CountAsync();
        var totalPlays = await _db.PlayEvents.CountAsync();
        var totalUsers = await _db.Users.CountAsync();
        var totalTags = await _db.Tags.CountAsync();

        var playsToday = await _db.PlayEvents.CountAsync(p => p.PlayedAt >= todayStart);
        var playsThisWeek = await _db.PlayEvents.CountAsync(p => p.PlayedAt >= weekStart);
        var playsThisMonth = await _db.PlayEvents.CountAsync(p => p.PlayedAt >= monthStart);

        var newRecordingsToday = await _db.Recordings.CountAsync(r => r.CreatedAt >= todayStart);
        var newRecordingsThisWeek = await _db.Recordings.CountAsync(r => r.CreatedAt >= weekStart);
        var newUsersThisWeek = await _db.Users.CountAsync(u => u.CreatedAt >= weekStart);

        return Ok(new OverviewStatsDto(
            TotalRecordings: totalRecordings,
            TotalPlays: totalPlays,
            TotalUsers: totalUsers,
            TotalTags: totalTags,
            PlaysToday: playsToday,
            PlaysThisWeek: playsThisWeek,
            PlaysThisMonth: playsThisMonth,
            NewRecordingsToday: newRecordingsToday,
            NewRecordingsThisWeek: newRecordingsThisWeek,
            NewUsersThisWeek: newUsersThisWeek
        ));
    }

    // ==================== HELPER METHODS ====================

    private static DateTime GetDateFromPeriod(string period)
    {
        return period.ToLower() switch
        {
            "day" => DateTime.UtcNow.AddDays(-1),
            "week" => DateTime.UtcNow.AddDays(-7),
            "month" => DateTime.UtcNow.AddDays(-30),
            "year" => DateTime.UtcNow.AddDays(-365),
            "all" => DateTime.MinValue,
            _ => DateTime.UtcNow.AddDays(-7)
        };
    }

    private static string GetTimeAgo(DateTime dateTime)
    {
        var span = DateTime.UtcNow - dateTime;

        if (span.TotalMinutes < 1) return "just now";
        if (span.TotalMinutes < 60) return $"{(int)span.TotalMinutes}m ago";
        if (span.TotalHours < 24) return $"{(int)span.TotalHours}h ago";
        if (span.TotalDays < 7) return $"{(int)span.TotalDays}d ago";
        if (span.TotalDays < 30) return $"{(int)(span.TotalDays / 7)}w ago";
        if (span.TotalDays < 365) return $"{(int)(span.TotalDays / 30)}mo ago";

        return $"{(int)(span.TotalDays / 365)}y ago";
    }
}
