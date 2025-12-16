using System.Security.Cryptography;
using Four33.Api.Auth;
using Four33.Api.Data;
using Four33.Api.Data.Entities;
using Four33.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Four33.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Get join requests with optional status filter
    /// </summary>
    [HttpGet("requests")]
    public async Task<ActionResult<PaginatedResult<JoinRequestDto>>> GetJoinRequests(
        [FromQuery] string? status = null,
        [FromQuery] int limit = 20,
        [FromQuery] int offset = 0)
    {
        var query = _db.JoinRequests
            .Include(r => r.ReviewedBy)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<JoinRequestStatus>(status, true, out var statusEnum))
        {
            query = query.Where(r => r.Status == statusEnum);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();

        return Ok(new PaginatedResult<JoinRequestDto>(
            Items: items.Select(r => r.ToDto()).ToList(),
            TotalCount: totalCount,
            HasMore: offset + items.Count < totalCount,
            Offset: offset,
            Limit: limit
        ));
    }

    /// <summary>
    /// Review (approve/reject) a join request
    /// </summary>
    [HttpPost("requests/{id}/review")]
    public async Task<ActionResult<JoinRequestDto>> ReviewRequest(
        Guid id,
        [FromBody] ReviewJoinRequestRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var joinRequest = await _db.JoinRequests.FindAsync(id);
        if (joinRequest == null)
        {
            return NotFound(new { error = "Request not found" });
        }

        if (joinRequest.Status != JoinRequestStatus.Pending)
        {
            return BadRequest(new { error = "Request has already been reviewed" });
        }

        joinRequest.Status = request.Approved ? JoinRequestStatus.Approved : JoinRequestStatus.Rejected;
        joinRequest.ReviewedAt = DateTime.UtcNow;
        joinRequest.ReviewedByUserId = userId;
        joinRequest.ReviewNotes = request.Notes;

        // If approved, generate an invite code
        if (request.Approved)
        {
            var code = GenerateCode();
            while (await _db.InviteCodes.AnyAsync(c => c.Code == code))
            {
                code = GenerateCode();
            }

            var inviteCode = new InviteCode
            {
                Id = Guid.NewGuid(),
                Code = code,
                CreatedByUserId = userId.Value, // Admin who approved
                ExpiresAt = DateTime.UtcNow.AddDays(30) // Longer expiry for approved requests
            };
            _db.InviteCodes.Add(inviteCode);
        }

        await _db.SaveChangesAsync();

        // Reload with ReviewedBy
        await _db.Entry(joinRequest).Reference(r => r.ReviewedBy).LoadAsync();

        return Ok(joinRequest.ToDto());
    }

    /// <summary>
    /// Get all users (admin view)
    /// </summary>
    [HttpGet("users")]
    public async Task<ActionResult<PaginatedResult<AdminUserDto>>> GetUsers(
        [FromQuery] string? search = null,
        [FromQuery] int limit = 20,
        [FromQuery] int offset = 0)
    {
        var query = _db.Users
            .Include(u => u.Recordings)
            .Include(u => u.Followers)
            .Include(u => u.InvitedBy)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(u =>
                u.Username.ToLower().Contains(searchLower) ||
                u.Email.ToLower().Contains(searchLower));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();

        return Ok(new PaginatedResult<AdminUserDto>(
            Items: items.Select(u => u.ToAdminDto()).ToList(),
            TotalCount: totalCount,
            HasMore: offset + items.Count < totalCount,
            Offset: offset,
            Limit: limit
        ));
    }

    /// <summary>
    /// Update a user (admin/invites)
    /// </summary>
    [HttpPut("users/{id}")]
    public async Task<ActionResult<AdminUserDto>> UpdateUser(
        Guid id,
        [FromBody] UpdateUserAdminRequest request)
    {
        var user = await _db.Users
            .Include(u => u.Recordings)
            .Include(u => u.Followers)
            .Include(u => u.InvitedBy)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound(new { error = "User not found" });
        }

        if (request.IsAdmin.HasValue)
        {
            user.IsAdmin = request.IsAdmin.Value;
        }

        if (request.InvitesRemaining.HasValue)
        {
            user.InvitesRemaining = request.InvitesRemaining.Value;
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(user.ToAdminDto());
    }

    /// <summary>
    /// Get all invite codes
    /// </summary>
    [HttpGet("invites")]
    public async Task<ActionResult<PaginatedResult<InviteCodeWithCreatorDto>>> GetAllInviteCodes(
        [FromQuery] int limit = 20,
        [FromQuery] int offset = 0)
    {
        var query = _db.InviteCodes
            .Include(c => c.CreatedBy)
            .Include(c => c.UsedBy)
            .AsQueryable();

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();

        return Ok(new PaginatedResult<InviteCodeWithCreatorDto>(
            Items: items.Select(c => c.ToDtoWithCreator()).ToList(),
            TotalCount: totalCount,
            HasMore: offset + items.Count < totalCount,
            Offset: offset,
            Limit: limit
        ));
    }

    /// <summary>
    /// Generate an admin invite code (no limit)
    /// </summary>
    [HttpPost("invites")]
    public async Task<ActionResult<InviteCodeWithCreatorDto>> GenerateAdminInvite()
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var code = GenerateCode();
        while (await _db.InviteCodes.AnyAsync(c => c.Code == code))
        {
            code = GenerateCode();
        }

        var inviteCode = new InviteCode
        {
            Id = Guid.NewGuid(),
            Code = code,
            CreatedByUserId = userId.Value,
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        };

        _db.InviteCodes.Add(inviteCode);
        await _db.SaveChangesAsync();

        // Reload with CreatedBy
        await _db.Entry(inviteCode).Reference(c => c.CreatedBy).LoadAsync();

        return Ok(inviteCode.ToDtoWithCreator());
    }

    /// <summary>
    /// Get admin dashboard stats
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<AdminStatsDto>> GetStats()
    {
        var totalUsers = await _db.Users.CountAsync();
        var totalRecordings = await _db.Recordings.CountAsync();
        var pendingRequests = await _db.JoinRequests.CountAsync(r => r.Status == JoinRequestStatus.Pending);
        var totalInviteCodes = await _db.InviteCodes.CountAsync();
        var usedInviteCodes = await _db.InviteCodes.CountAsync(c => c.UsedAt != null);

        return Ok(new AdminStatsDto(
            TotalUsers: totalUsers,
            TotalRecordings: totalRecordings,
            PendingRequests: pendingRequests,
            TotalInviteCodes: totalInviteCodes,
            UsedInviteCodes: usedInviteCodes
        ));
    }

    private static string GenerateCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var bytes = new byte[8];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);

        var result = new char[8];
        for (int i = 0; i < 8; i++)
        {
            result[i] = chars[bytes[i] % chars.Length];
        }
        return new string(result);
    }
}
