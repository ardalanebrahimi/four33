namespace Four33.Api.Data.Entities;

public class Like
{
    public Guid UserId { get; set; }
    public Guid RecordingId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public Recording Recording { get; set; } = null!;
}
