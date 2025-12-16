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
[Route("api/[controller]")]
public class InvitesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IJwtService _jwt;
    private readonly IPasswordService _password;

    public InvitesController(AppDbContext db, IJwtService jwt, IPasswordService password)
    {
        _db = db;
        _jwt = jwt;
        _password = password;
    }

    /// <summary>
    /// Submit a request to join the platform
    /// </summary>
    [HttpPost("request")]
    public async Task<ActionResult<JoinRequestDto>> SubmitJoinRequest([FromBody] JoinRequestSubmission request)
    {
        // Validate
        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Password) ||
            string.IsNullOrWhiteSpace(request.Reason))
        {
            return BadRequest(new { error = "All fields are required" });
        }

        if (request.Reason.Length < 20)
        {
            return BadRequest(new { error = "Please provide a more detailed reason (at least 20 characters)" });
        }

        if (request.Password.Length < 6)
        {
            return BadRequest(new { error = "Password must be at least 6 characters" });
        }

        // Check if email already exists as user
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
        {
            return BadRequest(new { error = "Email already registered" });
        }

        // Check if username already exists
        if (await _db.Users.AnyAsync(u => u.Username == request.Username))
        {
            return BadRequest(new { error = "Username already taken" });
        }

        // Check for pending request with same email
        var existingRequest = await _db.JoinRequests
            .FirstOrDefaultAsync(r => r.Email == request.Email && r.Status == JoinRequestStatus.Pending);

        if (existingRequest != null)
        {
            return BadRequest(new { error = "A request with this email is already pending" });
        }

        var joinRequest = new JoinRequest
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            Username = request.Username,
            PasswordHash = _password.HashPassword(request.Password),
            Reason = request.Reason
        };

        _db.JoinRequests.Add(joinRequest);
        await _db.SaveChangesAsync();

        return Ok(joinRequest.ToDto());
    }

    /// <summary>
    /// Check status of a join request by email
    /// </summary>
    [HttpGet("request/status")]
    public async Task<ActionResult<JoinRequestStatusResponse>> CheckRequestStatus([FromQuery] string email)
    {
        var request = await _db.JoinRequests
            .Include(r => r.ReviewedBy)
            .Where(r => r.Email == email)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();

        if (request == null)
        {
            return NotFound(new { error = "No request found for this email" });
        }

        // If approved, find the invite code generated for this request
        string? inviteCode = null;
        if (request.Status == JoinRequestStatus.Approved)
        {
            // Look for an unused invite code created around the review time
            var code = await _db.InviteCodes
                .Where(c => c.UsedByUserId == null)
                .Where(c => c.CreatedAt >= request.ReviewedAt!.Value.AddSeconds(-5))
                .Where(c => c.CreatedAt <= request.ReviewedAt!.Value.AddSeconds(5))
                .FirstOrDefaultAsync();

            inviteCode = code?.Code;
        }

        return Ok(new JoinRequestStatusResponse(
            Status: request.Status.ToString(),
            InviteCode: inviteCode,
            CreatedAt: request.CreatedAt,
            ReviewedAt: request.ReviewedAt
        ));
    }

    /// <summary>
    /// Validate an invite code without consuming it
    /// </summary>
    [HttpGet("validate/{code}")]
    public async Task<ActionResult<ValidateInviteResponse>> ValidateInviteCode(string code)
    {
        var inviteCode = await _db.InviteCodes.FirstOrDefaultAsync(c => c.Code == code);

        if (inviteCode == null)
        {
            return Ok(new ValidateInviteResponse(false, "Invalid invite code"));
        }

        if (inviteCode.IsUsed)
        {
            return Ok(new ValidateInviteResponse(false, "This invite code has already been used"));
        }

        if (inviteCode.IsExpired)
        {
            return Ok(new ValidateInviteResponse(false, "This invite code has expired"));
        }

        return Ok(new ValidateInviteResponse(true, null));
    }

    /// <summary>
    /// Register a new account using an invite code
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> RegisterWithInvite([FromBody] RegisterWithInviteRequest request)
    {
        // Validate invite code
        var inviteCode = await _db.InviteCodes
            .Include(c => c.CreatedBy)
            .FirstOrDefaultAsync(c => c.Code == request.InviteCode);

        if (inviteCode == null || !inviteCode.IsValid)
        {
            return BadRequest(new { error = "Invalid or expired invite code" });
        }

        // Validate user data
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
        {
            return BadRequest(new { error = "Email already registered" });
        }

        if (await _db.Users.AnyAsync(u => u.Username == request.Username))
        {
            return BadRequest(new { error = "Username already taken" });
        }

        if (request.Password.Length < 6)
        {
            return BadRequest(new { error = "Password must be at least 6 characters" });
        }

        // Create user
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = request.Username,
            Email = request.Email,
            PasswordHash = _password.HashPassword(request.Password),
            InvitedByUserId = inviteCode.CreatedByUserId,
            InvitesRemaining = 3 // New users get 3 invites
        };

        _db.Users.Add(user);

        // Mark invite code as used
        inviteCode.UsedByUserId = user.Id;
        inviteCode.UsedAt = DateTime.UtcNow;

        // Create refresh token
        var deviceInfo = Request.Headers.UserAgent.ToString();
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = _jwt.GenerateRefreshToken(),
            DeviceInfo = deviceInfo.Length > 500 ? deviceInfo[..500] : deviceInfo,
            ExpiresAt = _jwt.GetRefreshTokenExpiry()
        };
        _db.RefreshTokens.Add(refreshToken);

        await _db.SaveChangesAsync();

        var accessToken = _jwt.GenerateAccessToken(user);
        return Ok(new AuthResponse(
            AccessToken: accessToken,
            RefreshToken: refreshToken.Token,
            ExpiresAt: DateTime.UtcNow.AddHours(1),
            User: new UserProfileDto(
                Id: user.Id,
                Username: user.Username,
                Email: user.Email,
                FollowersCount: 0,
                FollowingCount: 0,
                RecordingsCount: 0,
                IsFollowing: null,
                CreatedAt: user.CreatedAt,
                IsAdmin: user.IsAdmin,
                InvitesRemaining: user.InvitesRemaining
            )
        ));
    }

    /// <summary>
    /// Get current user's invite codes
    /// </summary>
    [Authorize]
    [HttpGet("codes")]
    public async Task<ActionResult<List<InviteCodeDto>>> GetMyInviteCodes()
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var codes = await _db.InviteCodes
            .Include(c => c.UsedBy)
            .Where(c => c.CreatedByUserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return Ok(codes.Select(c => c.ToDto()).ToList());
    }

    /// <summary>
    /// Generate a new invite code (uses one of user's invites)
    /// </summary>
    [Authorize]
    [HttpPost("codes")]
    public async Task<ActionResult<InviteCodeDto>> GenerateInviteCode()
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _db.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        if (user.InvitesRemaining <= 0)
        {
            return BadRequest(new { error = "You have no invites remaining" });
        }

        // Generate unique code
        var code = GenerateCode();
        while (await _db.InviteCodes.AnyAsync(c => c.Code == code))
        {
            code = GenerateCode();
        }

        var inviteCode = new InviteCode
        {
            Id = Guid.NewGuid(),
            Code = code,
            CreatedByUserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        user.InvitesRemaining--;
        _db.InviteCodes.Add(inviteCode);
        await _db.SaveChangesAsync();

        return Ok(inviteCode.ToDto());
    }

    private static string GenerateCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars
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
