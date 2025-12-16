using Four33.Api.Auth;
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
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IJwtService _jwt;
    private readonly IPasswordService _password;
    private readonly ISocialAuthService _socialAuth;

    public AuthController(
        AppDbContext db,
        IJwtService jwt,
        IPasswordService password,
        ISocialAuthService socialAuth)
    {
        _db = db;
        _jwt = jwt;
        _password = password;
        _socialAuth = socialAuth;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
        {
            return BadRequest(new { error = "Email already registered" });
        }

        if (await _db.Users.AnyAsync(u => u.Username == request.Username))
        {
            return BadRequest(new { error = "Username already taken" });
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = request.Username,
            Email = request.Email,
            PasswordHash = _password.HashPassword(request.Password),
            InvitesRemaining = 0 // New users get 0 invites by default
        };

        _db.Users.Add(user);

        var refreshToken = CreateRefreshToken(user.Id);
        _db.RefreshTokens.Add(refreshToken);

        await _db.SaveChangesAsync();

        return Ok(CreateAuthResponse(user, refreshToken.Token));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _db.Users
            .Include(u => u.Followers)
            .Include(u => u.Following)
            .Include(u => u.Recordings)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null || user.PasswordHash == null)
        {
            return Unauthorized(new { error = "Invalid email or password" });
        }

        if (!_password.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { error = "Invalid email or password" });
        }

        var refreshToken = CreateRefreshToken(user.Id);
        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync();

        return Ok(CreateAuthResponse(user, refreshToken.Token));
    }

    [HttpPost("google")]
    public async Task<ActionResult<AuthResponse>> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        var validation = await _socialAuth.ValidateGoogleTokenAsync(request.IdToken);

        if (!validation.IsValid || validation.Email == null || validation.GoogleId == null)
        {
            return Unauthorized(new { error = "Invalid Google token" });
        }

        var user = await _db.Users
            .Include(u => u.Followers)
            .Include(u => u.Following)
            .Include(u => u.Recordings)
            .FirstOrDefaultAsync(u => u.GoogleId == validation.GoogleId || u.Email == validation.Email);

        if (user == null)
        {
            // Create new user
            user = new User
            {
                Id = Guid.NewGuid(),
                Username = GenerateUsername(validation.Name ?? validation.Email),
                Email = validation.Email,
                GoogleId = validation.GoogleId,
                InvitesRemaining = 0
            };
            _db.Users.Add(user);
        }
        else if (user.GoogleId == null)
        {
            // Link Google to existing account
            user.GoogleId = validation.GoogleId;
        }

        var refreshToken = CreateRefreshToken(user.Id);
        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync();

        return Ok(CreateAuthResponse(user, refreshToken.Token));
    }

    [HttpPost("apple")]
    public async Task<ActionResult<AuthResponse>> AppleLogin([FromBody] AppleLoginRequest request)
    {
        var validation = await _socialAuth.ValidateAppleTokenAsync(request.IdToken);

        if (!validation.IsValid || validation.Email == null || validation.AppleId == null)
        {
            return Unauthorized(new { error = "Invalid Apple token" });
        }

        var user = await _db.Users
            .Include(u => u.Followers)
            .Include(u => u.Following)
            .Include(u => u.Recordings)
            .FirstOrDefaultAsync(u => u.AppleId == validation.AppleId || u.Email == validation.Email);

        if (user == null)
        {
            // Create new user
            user = new User
            {
                Id = Guid.NewGuid(),
                Username = GenerateUsername(request.FullName ?? validation.Email),
                Email = validation.Email,
                AppleId = validation.AppleId,
                InvitesRemaining = 0
            };
            _db.Users.Add(user);
        }
        else if (user.AppleId == null)
        {
            // Link Apple to existing account
            user.AppleId = validation.AppleId;
        }

        var refreshToken = CreateRefreshToken(user.Id);
        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync();

        return Ok(CreateAuthResponse(user, refreshToken.Token));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshTokenRequest request)
    {
        var refreshToken = await _db.RefreshTokens
            .Include(rt => rt.User)
                .ThenInclude(u => u.Followers)
            .Include(rt => rt.User)
                .ThenInclude(u => u.Following)
            .Include(rt => rt.User)
                .ThenInclude(u => u.Recordings)
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

        if (refreshToken == null || !refreshToken.IsActive)
        {
            return Unauthorized(new { error = "Invalid or expired refresh token" });
        }

        var user = refreshToken.User;

        // Sliding window: only rotate token if close to expiry (less than 1 day remaining)
        if (refreshToken.ExpiresAt < DateTime.UtcNow.AddDays(1))
        {
            // Revoke old token and create new one
            refreshToken.RevokedAt = DateTime.UtcNow;
            var newRefreshToken = CreateRefreshToken(user.Id);
            _db.RefreshTokens.Add(newRefreshToken);
            await _db.SaveChangesAsync();
            return Ok(CreateAuthResponse(user, newRefreshToken.Token));
        }

        // Token still has plenty of time, just return new access token with same refresh token
        await _db.SaveChangesAsync();
        return Ok(CreateAuthResponse(user, refreshToken.Token));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest? request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        if (request?.RefreshToken != null)
        {
            // Revoke specific token
            var refreshToken = await _db.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken && rt.UserId == userId);
            if (refreshToken != null)
            {
                refreshToken.RevokedAt = DateTime.UtcNow;
            }
        }
        else
        {
            // Revoke all tokens for user (logout everywhere)
            var tokens = await _db.RefreshTokens
                .Where(rt => rt.UserId == userId && rt.RevokedAt == null)
                .ToListAsync();
            foreach (var token in tokens)
            {
                token.RevokedAt = DateTime.UtcNow;
            }
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }

    private RefreshToken CreateRefreshToken(Guid userId)
    {
        var deviceInfo = Request.Headers.UserAgent.ToString();
        return new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = _jwt.GenerateRefreshToken(),
            DeviceInfo = deviceInfo.Length > 500 ? deviceInfo[..500] : deviceInfo,
            ExpiresAt = _jwt.GetRefreshTokenExpiry()
        };
    }

    private AuthResponse CreateAuthResponse(User user, string refreshToken)
    {
        var accessToken = _jwt.GenerateAccessToken(user);
        return new AuthResponse(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            ExpiresAt: DateTime.UtcNow.AddHours(1),
            User: user.ToProfileDto()
        );
    }

    private string GenerateUsername(string baseName)
    {
        var clean = new string(baseName
            .ToLowerInvariant()
            .Where(c => char.IsLetterOrDigit(c) || c == '_')
            .Take(20)
            .ToArray());

        if (string.IsNullOrEmpty(clean))
            clean = "user";

        var username = clean;
        var suffix = 1;

        while (_db.Users.Any(u => u.Username == username))
        {
            username = $"{clean}{suffix++}";
        }

        return username;
    }
}

public static class ClaimsPrincipalExtensions
{
    public static Guid? GetUserId(this System.Security.Claims.ClaimsPrincipal user)
    {
        var claim = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }

    public static bool IsAdmin(this System.Security.Claims.ClaimsPrincipal user)
    {
        return user.HasClaim("IsAdmin", "true");
    }
}
