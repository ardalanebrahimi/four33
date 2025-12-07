namespace Four33.Api.Data.Entities;

public class UserFollow
{
    public Guid FollowerId { get; set; }
    public Guid FollowingId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User Follower { get; set; } = null!;
    public User Following { get; set; } = null!;
}
