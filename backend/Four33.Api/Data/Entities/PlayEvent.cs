namespace Four33.Api.Data.Entities;

public class PlayEvent
{
    public Guid Id { get; set; }
    public Guid RecordingId { get; set; }
    public Guid? UserId { get; set; } // Nullable for anonymous plays
    public DateTime PlayedAt { get; set; } = DateTime.UtcNow;
    public int DurationListened { get; set; } // Seconds listened
    public int CompletedPercent { get; set; } // 0-100
    public string Source { get; set; } = "unknown"; // "explore", "detail", "profile", "tag"

    // Navigation properties
    public Recording Recording { get; set; } = null!;
    public User? User { get; set; }
}
