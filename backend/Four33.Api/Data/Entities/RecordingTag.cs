namespace Four33.Api.Data.Entities;

public class RecordingTag
{
    public Guid Id { get; set; }
    public Guid RecordingId { get; set; }
    public Guid TagId { get; set; }
    public Guid? AddedByUserId { get; set; }
    public bool IsOriginal { get; set; } // True if added by recording owner
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Recording Recording { get; set; } = null!;
    public Tag Tag { get; set; } = null!;
    public User? AddedByUser { get; set; }
}
