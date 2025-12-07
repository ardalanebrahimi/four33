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
            RefreshToken = _jwt.GenerateRefreshToken(),
            RefreshTokenExpiryTime = _jwt.GetRefreshTokenExpiry()
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(CreateAuthResponse(user));
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

        user.RefreshToken = _jwt.GenerateRefreshToken();
        user.RefreshTokenExpiryTime = _jwt.GetRefreshTokenExpiry();
        await _db.SaveChangesAsync();

        return Ok(CreateAuthResponse(user));
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
                GoogleId = validation.GoogleId
            };
            _db.Users.Add(user);
        }
        else if (user.GoogleId == null)
        {
            // Link Google to existing account
            user.GoogleId = validation.GoogleId;
        }

        user.RefreshToken = _jwt.GenerateRefreshToken();
        user.RefreshTokenExpiryTime = _jwt.GetRefreshTokenExpiry();
        await _db.SaveChangesAsync();

        return Ok(CreateAuthResponse(user));
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
                AppleId = validation.AppleId
            };
            _db.Users.Add(user);
        }
        else if (user.AppleId == null)
        {
            // Link Apple to existing account
            user.AppleId = validation.AppleId;
        }

        user.RefreshToken = _jwt.GenerateRefreshToken();
        user.RefreshTokenExpiryTime = _jwt.GetRefreshTokenExpiry();
        await _db.SaveChangesAsync();

        return Ok(CreateAuthResponse(user));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshTokenRequest request)
    {
        var user = await _db.Users
            .Include(u => u.Followers)
            .Include(u => u.Following)
            .Include(u => u.Recordings)
            .FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken);

        if (user == null || user.RefreshTokenExpiryTime < DateTime.UtcNow)
        {
            return Unauthorized(new { error = "Invalid or expired refresh token" });
        }

        user.RefreshToken = _jwt.GenerateRefreshToken();
        user.RefreshTokenExpiryTime = _jwt.GetRefreshTokenExpiry();
        await _db.SaveChangesAsync();

        return Ok(CreateAuthResponse(user));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _db.Users.FindAsync(userId);
        if (user != null)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
            await _db.SaveChangesAsync();
        }

        return NoContent();
    }

    private AuthResponse CreateAuthResponse(User user)
    {
        var accessToken = _jwt.GenerateAccessToken(user);
        return new AuthResponse(
            AccessToken: accessToken,
            RefreshToken: user.RefreshToken!,
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
}
