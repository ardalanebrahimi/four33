namespace Four33.Api.Data.Entities;

public class Tag
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<RecordingTag> RecordingTags { get; set; } = [];
    public ICollection<TagFollow> Followers { get; set; } = [];
}
