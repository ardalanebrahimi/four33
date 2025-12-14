namespace Four33.Api.Data.Entities;

public class ViewEvent
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; } // Nullable for anonymous views
    public string PageType { get; set; } = null!; // "recording", "tag", "user"
    public string PageId { get; set; } = null!; // The recording/tag/user id
    public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
    public string? Source { get; set; } // Referrer page

    // Navigation properties
    public User? User { get; set; }
}
