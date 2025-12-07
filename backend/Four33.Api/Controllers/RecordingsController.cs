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
public class RecordingsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IBlobStorageService _blobStorage;
    private static readonly string[] ValidMovements = ["I", "II", "III", "FULL"];

    public RecordingsController(AppDbContext db, IBlobStorageService blobStorage)
    {
        _db = db;
        _blobStorage = blobStorage;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<RecordingListDto>>> GetRecordings(
        [FromQuery] string? tag = null,
        [FromQuery] Guid? userId = null,
        [FromQuery] string? movement = null,
        [FromQuery] bool following = false,
        [FromQuery] int limit = 20,
        [FromQuery] int offset = 0)
    {
        var currentUserId = User.GetUserId();

        var query = _db.Recordings
            .Include(r => r.User).ThenInclude(u => u.Followers)
            .Include(r => r.User).ThenInclude(u => u.Following)
            .Include(r => r.User).ThenInclude(u => u.Recordings)
            .Include(r => r.Tags).ThenInclude(t => t.Tag).ThenInclude(t => t.Followers)
            .Include(r => r.Tags).ThenInclude(t => t.Tag).ThenInclude(t => t.RecordingTags)
            .Include(r => r.Likes)
            .AsQueryable();

        if (!string.IsNullOrEmpty(tag))
        {
            query = query.Where(r => r.Tags.Any(t => t.Tag.Name == tag.ToLower()));
        }

        if (userId.HasValue)
        {
            query = query.Where(r => r.UserId == userId);
        }

        if (!string.IsNullOrEmpty(movement) && ValidMovements.Contains(movement))
        {
            query = query.Where(r => r.Movement == movement);
        }

        if (following && currentUserId.HasValue)
        {
            var followedUserIds = await _db.UserFollows
                .Where(f => f.FollowerId == currentUserId)
                .Select(f => f.FollowingId)
                .ToListAsync();

            var followedTagIds = await _db.TagFollows
                .Where(f => f.UserId == currentUserId)
                .Select(f => f.TagId)
                .ToListAsync();

            query = query.Where(r =>
                followedUserIds.Contains(r.UserId) ||
                r.Tags.Any(t => followedTagIds.Contains(t.TagId)));
        }

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

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<RecordingDto>> GetRecording(Guid id)
    {
        var currentUserId = User.GetUserId();

        var recording = await _db.Recordings
            .Include(r => r.User).ThenInclude(u => u.Followers)
            .Include(r => r.User).ThenInclude(u => u.Following)
            .Include(r => r.User).ThenInclude(u => u.Recordings)
            .Include(r => r.Tags).ThenInclude(t => t.Tag).ThenInclude(t => t.Followers)
            .Include(r => r.Tags).ThenInclude(t => t.Tag).ThenInclude(t => t.RecordingTags)
            .Include(r => r.Likes).ThenInclude(l => l.User).ThenInclude(u => u.Followers)
            .Include(r => r.Likes).ThenInclude(l => l.User).ThenInclude(u => u.Following)
            .Include(r => r.Likes).ThenInclude(l => l.User).ThenInclude(u => u.Recordings)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (recording == null)
        {
            return NotFound();
        }

        return Ok(recording.ToDto(currentUserId));
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<RecordingDto>> CreateRecording(
        [FromForm] IFormFile audioFile,
        [FromForm] string movement,
        [FromForm] int durationSeconds,
        [FromForm] string? waveformData,
        [FromForm] string tags,
        [FromForm] string? title)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        if (!ValidMovements.Contains(movement))
        {
            return BadRequest(new { error = "Invalid movement. Must be I, II, III, or FULL" });
        }

        var tagList = tags.Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(t => t.Trim().ToLower())
            .Where(t => t.Length <= 20)
            .Distinct()
            .ToList();

        if (tagList.Count < 3 || tagList.Count > 5)
        {
            return BadRequest(new { error = "Must provide 3-5 tags" });
        }

        // Upload audio to blob storage
        var audioUrl = await _blobStorage.UploadAudioAsync(audioFile, userId.Value);

        // Parse waveform data
        int[]? waveform = null;
        if (!string.IsNullOrEmpty(waveformData))
        {
            try
            {
                waveform = System.Text.Json.JsonSerializer.Deserialize<int[]>(waveformData);
            }
            catch { /* Ignore invalid waveform data */ }
        }

        var recording = new Recording
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
            Movement = movement,
            DurationSeconds = durationSeconds,
            AudioBlobUrl = audioUrl,
            WaveformData = waveform,
            Title = string.IsNullOrWhiteSpace(title) ? null : title.Trim()
        };

        _db.Recordings.Add(recording);

        // Add tags
        foreach (var tagName in tagList)
        {
            var tag = await _db.Tags.FirstOrDefaultAsync(t => t.Name == tagName);
            if (tag == null)
            {
                tag = new Tag { Id = Guid.NewGuid(), Name = tagName };
                _db.Tags.Add(tag);
            }

            _db.RecordingTags.Add(new RecordingTag
            {
                Id = Guid.NewGuid(),
                RecordingId = recording.Id,
                TagId = tag.Id,
                AddedByUserId = userId,
                IsOriginal = true
            });
        }

        await _db.SaveChangesAsync();

        // Reload with all includes
        var result = await _db.Recordings
            .Include(r => r.User).ThenInclude(u => u.Followers)
            .Include(r => r.User).ThenInclude(u => u.Following)
            .Include(r => r.User).ThenInclude(u => u.Recordings)
            .Include(r => r.Tags).ThenInclude(t => t.Tag).ThenInclude(t => t.Followers)
            .Include(r => r.Tags).ThenInclude(t => t.Tag).ThenInclude(t => t.RecordingTags)
            .Include(r => r.Likes)
            .FirstAsync(r => r.Id == recording.Id);

        return CreatedAtAction(nameof(GetRecording), new { id = recording.Id }, result.ToDto(userId));
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteRecording(Guid id)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var recording = await _db.Recordings.FindAsync(id);
        if (recording == null) return NotFound();

        if (recording.UserId != userId)
        {
            return Forbid();
        }

        // Delete from blob storage
        await _blobStorage.DeleteAudioAsync(recording.AudioBlobUrl);

        _db.Recordings.Remove(recording);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [Authorize]
    [HttpPost("{id:guid}/like")]
    public async Task<IActionResult> LikeRecording(Guid id)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var recording = await _db.Recordings.FindAsync(id);
        if (recording == null) return NotFound();

        var existingLike = await _db.Likes.FindAsync(userId, id);
        if (existingLike != null)
        {
            return Ok(new { liked = true });
        }

        _db.Likes.Add(new Like { UserId = userId.Value, RecordingId = id });
        await _db.SaveChangesAsync();

        return Ok(new { liked = true });
    }

    [Authorize]
    [HttpDelete("{id:guid}/like")]
    public async Task<IActionResult> UnlikeRecording(Guid id)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var like = await _db.Likes.FindAsync(userId, id);
        if (like == null)
        {
            return Ok(new { liked = false });
        }

        _db.Likes.Remove(like);
        await _db.SaveChangesAsync();

        return Ok(new { liked = false });
    }

    [Authorize]
    [HttpPost("{id:guid}/tags")]
    public async Task<ActionResult<TagDto>> AddTagToRecording(Guid id, [FromBody] AddTagRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var recording = await _db.Recordings
            .Include(r => r.Tags)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (recording == null) return NotFound();

        var tagName = request.TagName.Trim().ToLower();
        if (tagName.Length > 20)
        {
            return BadRequest(new { error = "Tag must be 20 characters or less" });
        }

        // Check if tag already exists on this recording
        if (recording.Tags.Any(t => t.Tag.Name == tagName))
        {
            return BadRequest(new { error = "Tag already exists on this recording" });
        }

        var tag = await _db.Tags
            .Include(t => t.Followers)
            .Include(t => t.RecordingTags)
            .FirstOrDefaultAsync(t => t.Name == tagName);

        if (tag == null)
        {
            tag = new Tag { Id = Guid.NewGuid(), Name = tagName };
            _db.Tags.Add(tag);
        }

        var recordingTag = new RecordingTag
        {
            Id = Guid.NewGuid(),
            RecordingId = id,
            TagId = tag.Id,
            AddedByUserId = userId,
            IsOriginal = recording.UserId == userId
        };

        _db.RecordingTags.Add(recordingTag);
        await _db.SaveChangesAsync();

        return Ok(new TagDto(
            Id: tag.Id,
            Name: tag.Name,
            RecordingCount: tag.RecordingTags.Count + 1,
            IsFollowing: tag.Followers.Any(f => f.UserId == userId),
            IsOriginal: recordingTag.IsOriginal
        ));
    }
}
