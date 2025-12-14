namespace Four33.Api.Data.Entities;

public class SearchEvent
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; } // Nullable for anonymous searches
    public string Query { get; set; } = null!;
    public int ResultsCount { get; set; }
    public DateTime SearchedAt { get; set; } = DateTime.UtcNow;
    public Guid? ClickedResultId { get; set; } // If they clicked a result

    // Navigation properties
    public User? User { get; set; }
}
