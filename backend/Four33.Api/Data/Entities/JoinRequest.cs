namespace Four33.Api.Data.Entities;

public enum JoinRequestStatus
{
    Pending,
    Approved,
    Rejected
}

public class JoinRequest
{
    public Guid Id { get; set; }
    public required string Email { get; set; }
    public required string Username { get; set; }
    public string? PasswordHash { get; set; }
    public required string Reason { get; set; }
    public JoinRequestStatus Status { get; set; } = JoinRequestStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public string? ReviewNotes { get; set; }

    // Navigation
    public User? ReviewedBy { get; set; }
}
