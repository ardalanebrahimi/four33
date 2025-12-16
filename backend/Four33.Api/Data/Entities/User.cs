namespace Four33.Api.Data.Entities;

public class User
{
    public Guid Id { get; set; }
    public required string Username { get; set; }
    public required string Email { get; set; }
    public string? PasswordHash { get; set; } // Null for social login users
    public string? GoogleId { get; set; }
    public string? AppleId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Invite system fields
    public bool IsAdmin { get; set; } = false;
    public int InvitesRemaining { get; set; } = 0;
    public Guid? InvitedByUserId { get; set; }

    // Navigation properties
    public User? InvitedBy { get; set; }
    public ICollection<Recording> Recordings { get; set; } = [];
    public ICollection<Like> Likes { get; set; } = [];
    public ICollection<UserFollow> Followers { get; set; } = [];
    public ICollection<UserFollow> Following { get; set; } = [];
    public ICollection<TagFollow> FollowedTags { get; set; } = [];
    public ICollection<RecordingTag> AddedTags { get; set; } = [];
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    public ICollection<InviteCode> CreatedInviteCodes { get; set; } = [];
    public ICollection<JoinRequest> ReviewedRequests { get; set; } = [];
}
