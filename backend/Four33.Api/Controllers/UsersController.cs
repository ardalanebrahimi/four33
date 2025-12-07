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
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserProfileDto>> GetCurrentUser()
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _db.Users
            .Include(u => u.Followers)
            .Include(u => u.Following)
            .Include(u => u.Recordings)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return NotFound();

        return Ok(user.ToProfileDto());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserProfileDto>> GetUser(Guid id)
    {
        var currentUserId = User.GetUserId();

        var user = await _db.Users
            .Include(u => u.Followers)
            .Include(u => u.Following)
            .Include(u => u.Recordings)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) return NotFound();

        return Ok(user.ToProfileDto(currentUserId));
    }

    [HttpGet("{id:guid}/recordings")]
    public async Task<ActionResult<PaginatedResult<RecordingListDto>>> GetUserRecordings(
        Guid id,
        [FromQuery] int limit = 20,
        [FromQuery] int offset = 0)
    {
        var currentUserId = User.GetUserId();

        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        var query = _db.Recordings
            .Include(r => r.User).ThenInclude(u => u.Followers)
            .Include(r => r.User).ThenInclude(u => u.Following)
            .Include(r => r.User).ThenInclude(u => u.Recordings)
            .Include(r => r.Tags).ThenInclude(t => t.Tag).ThenInclude(t => t.Followers)
            .Include(r => r.Tags).ThenInclude(t => t.Tag).ThenInclude(t => t.RecordingTags)
            .Include(r => r.Likes)
            .Where(r => r.UserId == id);

        var totalCount = await query.CountAsync();

        var recordings = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();

        var items = recordings.Select(r => r.ToListDto(currentUserId)).ToList();

        return Ok(new PaginatedResult<RecordingListDto>(
            Items: items,
            TotalCount: totalCount,
            HasMore: offset + limit < totalCount,
            Offset: offset,
            Limit: limit
        ));
    }

    [HttpGet("{id:guid}/followers")]
    public async Task<ActionResult<PaginatedResult<UserSummaryDto>>> GetFollowers(
        Guid id,
        [FromQuery] int limit = 20,
        [FromQuery] int offset = 0)
    {
        var currentUserId = User.GetUserId();

        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        var query = _db.UserFollows
            .Include(f => f.Follower).ThenInclude(u => u.Followers)
            .Include(f => f.Follower).ThenInclude(u => u.Following)
            .Include(f => f.Follower).ThenInclude(u => u.Recordings)
            .Where(f => f.FollowingId == id);

        var totalCount = await query.CountAsync();

        var followers = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .Select(f => f.Follower)
            .ToListAsync();

        var items = followers.Select(u => u.ToSummaryDto(currentUserId)).ToList();

        return Ok(new PaginatedResult<UserSummaryDto>(
            Items: items,
            TotalCount: totalCount,
            HasMore: offset + limit < totalCount,
            Offset: offset,
            Limit: limit
        ));
    }

    [HttpGet("{id:guid}/following")]
    public async Task<ActionResult<PaginatedResult<UserSummaryDto>>> GetFollowing(
        Guid id,
        [FromQuery] int limit = 20,
        [FromQuery] int offset = 0)
    {
        var currentUserId = User.GetUserId();

        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        var query = _db.UserFollows
            .Include(f => f.Following).ThenInclude(u => u.Followers)
            .Include(f => f.Following).ThenInclude(u => u.Following)
            .Include(f => f.Following).ThenInclude(u => u.Recordings)
            .Where(f => f.FollowerId == id);

        var totalCount = await query.CountAsync();

        var following = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .Select(f => f.Following)
            .ToListAsync();

        var items = following.Select(u => u.ToSummaryDto(currentUserId)).ToList();

        return Ok(new PaginatedResult<UserSummaryDto>(
            Items: items,
            TotalCount: totalCount,
            HasMore: offset + limit < totalCount,
            Offset: offset,
            Limit: limit
        ));
    }

    [Authorize]
    [HttpPost("{id:guid}/follow")]
    public async Task<IActionResult> FollowUser(Guid id)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        if (userId == id)
        {
            return BadRequest(new { error = "Cannot follow yourself" });
        }

        var targetUser = await _db.Users.FindAsync(id);
        if (targetUser == null) return NotFound();

        var existingFollow = await _db.UserFollows.FindAsync(userId, id);
        if (existingFollow != null)
        {
            return Ok(new { following = true });
        }

        _db.UserFollows.Add(new UserFollow
        {
            FollowerId = userId.Value,
            FollowingId = id
        });
        await _db.SaveChangesAsync();

        return Ok(new { following = true });
    }

    [Authorize]
    [HttpDelete("{id:guid}/follow")]
    public async Task<IActionResult> UnfollowUser(Guid id)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var follow = await _db.UserFollows.FindAsync(userId, id);
        if (follow == null)
        {
            return Ok(new { following = false });
        }

        _db.UserFollows.Remove(follow);
        await _db.SaveChangesAsync();

        return Ok(new { following = false });
    }

    [Authorize]
    [HttpGet("me/activity")]
    public async Task<ActionResult<List<ActivityDto>>> GetActivity([FromQuery] int limit = 20)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        // Get likes on user's recordings
        var likeActivities = await _db.Likes
            .Include(l => l.User).ThenInclude(u => u.Followers)
            .Include(l => l.User).ThenInclude(u => u.Following)
            .Include(l => l.User).ThenInclude(u => u.Recordings)
            .Include(l => l.Recording).ThenInclude(r => r.User).ThenInclude(u => u.Followers)
            .Include(l => l.Recording).ThenInclude(r => r.Tags).ThenInclude(t => t.Tag)
            .Include(l => l.Recording).ThenInclude(r => r.Likes)
            .Where(l => l.Recording.UserId == userId && l.UserId != userId)
            .OrderByDescending(l => l.CreatedAt)
            .Take(limit)
            .Select(l => new ActivityDto(
                Guid.NewGuid(),
                "like",
                l.User.ToSummaryDto(userId),
                l.Recording.ToListDto(userId),
                null,
                l.CreatedAt,
                ""
            ))
            .ToListAsync();

        // Get new followers
        var followActivities = await _db.UserFollows
            .Include(f => f.Follower).ThenInclude(u => u.Followers)
            .Include(f => f.Follower).ThenInclude(u => u.Following)
            .Include(f => f.Follower).ThenInclude(u => u.Recordings)
            .Where(f => f.FollowingId == userId)
            .OrderByDescending(f => f.CreatedAt)
            .Take(limit)
            .Select(f => new ActivityDto(
                Guid.NewGuid(),
                "follow",
                f.Follower.ToSummaryDto(userId),
                null,
                null,
                f.CreatedAt,
                ""
            ))
            .ToListAsync();

        var activities = likeActivities
            .Concat(followActivities)
            .OrderByDescending(a => a.CreatedAt)
            .Take(limit)
            .Select(a => a with { TimeAgo = GetTimeAgo(a.CreatedAt) })
            .ToList();

        return Ok(activities);
    }

    [Authorize]
    [HttpPut("me")]
    public async Task<ActionResult<UserProfileDto>> UpdateCurrentUser([FromBody] UpdateUserRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _db.Users
            .Include(u => u.Followers)
            .Include(u => u.Following)
            .Include(u => u.Recordings)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return NotFound();

        if (!string.IsNullOrEmpty(request.Username))
        {
            if (await _db.Users.AnyAsync(u => u.Username == request.Username && u.Id != userId))
            {
                return BadRequest(new { error = "Username already taken" });
            }
            user.Username = request.Username;
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(user.ToProfileDto());
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
