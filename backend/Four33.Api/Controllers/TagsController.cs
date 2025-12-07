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
public class TagsController : ControllerBase
{
    private readonly AppDbContext _db;

    public TagsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<TagListDto>>> GetTags(
        [FromQuery] int limit = 50,
        [FromQuery] string? search = null)
    {
        var currentUserId = User.GetUserId();

        var query = _db.Tags
            .Include(t => t.RecordingTags)
            .Include(t => t.Followers)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(t => t.Name.Contains(searchLower));
        }

        var tags = await query
            .OrderByDescending(t => t.RecordingTags.Count)
            .Take(limit)
            .ToListAsync();

        return Ok(tags.Select(t => t.ToListDto(currentUserId)).ToList());
    }

    [HttpGet("{name}")]
    public async Task<ActionResult<TagDetailDto>> GetTag(string name)
    {
        var currentUserId = User.GetUserId();
        var tagName = name.ToLower();

        var tag = await _db.Tags
            .Include(t => t.RecordingTags)
            .Include(t => t.Followers)
            .FirstOrDefaultAsync(t => t.Name == tagName);

        if (tag == null) return NotFound();

        return Ok(tag.ToDetailDto(currentUserId));
    }

    [HttpGet("{name}/recordings")]
    public async Task<ActionResult<PaginatedResult<RecordingListDto>>> GetTagRecordings(
        string name,
        [FromQuery] int limit = 20,
        [FromQuery] int offset = 0)
    {
        var currentUserId = User.GetUserId();
        var tagName = name.ToLower();

        var tag = await _db.Tags.FirstOrDefaultAsync(t => t.Name == tagName);
        if (tag == null) return NotFound();

        var query = _db.Recordings
            .Include(r => r.User).ThenInclude(u => u.Followers)
            .Include(r => r.User).ThenInclude(u => u.Following)
            .Include(r => r.User).ThenInclude(u => u.Recordings)
            .Include(r => r.Tags).ThenInclude(t => t.Tag).ThenInclude(t => t.Followers)
            .Include(r => r.Tags).ThenInclude(t => t.Tag).ThenInclude(t => t.RecordingTags)
            .Include(r => r.Likes)
            .Where(r => r.Tags.Any(t => t.TagId == tag.Id));

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

    [Authorize]
    [HttpPost("{name}/follow")]
    public async Task<IActionResult> FollowTag(string name)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var tagName = name.ToLower();
        var tag = await _db.Tags.FirstOrDefaultAsync(t => t.Name == tagName);

        if (tag == null)
        {
            // Create tag if it doesn't exist
            tag = new Tag { Id = Guid.NewGuid(), Name = tagName };
            _db.Tags.Add(tag);
        }

        var existingFollow = await _db.TagFollows.FindAsync(userId, tag.Id);
        if (existingFollow != null)
        {
            return Ok(new { following = true });
        }

        _db.TagFollows.Add(new TagFollow
        {
            UserId = userId.Value,
            TagId = tag.Id
        });
        await _db.SaveChangesAsync();

        return Ok(new { following = true });
    }

    [Authorize]
    [HttpDelete("{name}/follow")]
    public async Task<IActionResult> UnfollowTag(string name)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var tagName = name.ToLower();
        var tag = await _db.Tags.FirstOrDefaultAsync(t => t.Name == tagName);

        if (tag == null) return NotFound();

        var follow = await _db.TagFollows.FindAsync(userId, tag.Id);
        if (follow == null)
        {
            return Ok(new { following = false });
        }

        _db.TagFollows.Remove(follow);
        await _db.SaveChangesAsync();

        return Ok(new { following = false });
    }

    [Authorize]
    [HttpGet("following")]
    public async Task<ActionResult<List<TagListDto>>> GetFollowedTags()
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var tags = await _db.TagFollows
            .Include(f => f.Tag).ThenInclude(t => t.RecordingTags)
            .Include(f => f.Tag).ThenInclude(t => t.Followers)
            .Where(f => f.UserId == userId)
            .Select(f => f.Tag)
            .OrderByDescending(t => t.RecordingTags.Count)
            .ToListAsync();

        return Ok(tags.Select(t => t.ToListDto(userId)).ToList());
    }
}
