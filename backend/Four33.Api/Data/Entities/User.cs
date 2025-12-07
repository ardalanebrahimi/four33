namespace Four33.Api.Data.Entities;

public class User
{
    public Guid Id { get; set; }
    public required string Username { get; set; }
    public required string Email { get; set; }
    public string? PasswordHash { get; set; } // Null for social login users
    public string? GoogleId { get; set; }
    public string? AppleId { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Recording> Recordings { get; set; } = [];
    public ICollection<Like> Likes { get; set; } = [];
    public ICollection<UserFollow> Followers { get; set; } = [];
    public ICollection<UserFollow> Following { get; set; } = [];
    public ICollection<TagFollow> FollowedTags { get; set; } = [];
    public ICollection<RecordingTag> AddedTags { get; set; } = [];
}
