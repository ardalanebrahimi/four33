namespace Four33.Api.Data.Entities;

public class TagFollow
{
    public Guid UserId { get; set; }
    public Guid TagId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public Tag Tag { get; set; } = null!;
}
