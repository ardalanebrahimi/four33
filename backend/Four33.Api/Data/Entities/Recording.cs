namespace Four33.Api.Data.Entities;

public class Recording
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public required string Movement { get; set; } // "I", "II", "III", "FULL"
    public int DurationSeconds { get; set; }
    public required string AudioBlobUrl { get; set; }
    public int[]? WaveformData { get; set; }
    public string? Title { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Analytics
    public int PlayCount { get; set; } = 0;
    public int UniqueListeners { get; set; } = 0;

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<RecordingTag> Tags { get; set; } = [];
    public ICollection<Like> Likes { get; set; } = [];
    public ICollection<PlayEvent> PlayEvents { get; set; } = [];
}
