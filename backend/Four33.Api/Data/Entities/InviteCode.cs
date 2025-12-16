namespace Four33.Api.Data.Entities;

public class InviteCode
{
    public Guid Id { get; set; }
    public required string Code { get; set; }
    public Guid CreatedByUserId { get; set; }
    public Guid? UsedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }

    public bool IsUsed => UsedAt != null;
    public bool IsExpired => DateTime.UtcNow > ExpiresAt && !IsUsed;
    public bool IsValid => !IsUsed && !IsExpired;

    // Navigation
    public User CreatedBy { get; set; } = null!;
    public User? UsedBy { get; set; }
}
