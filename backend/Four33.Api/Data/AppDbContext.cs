using Four33.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Four33.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Recording> Recordings => Set<Recording>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<RecordingTag> RecordingTags => Set<RecordingTag>();
    public DbSet<Like> Likes => Set<Like>();
    public DbSet<UserFollow> UserFollows => Set<UserFollow>();
    public DbSet<TagFollow> TagFollows => Set<TagFollow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.GoogleId).IsUnique().HasFilter("\"GoogleId\" IS NOT NULL");
            entity.HasIndex(e => e.AppleId).IsUnique().HasFilter("\"AppleId\" IS NOT NULL");
            entity.Property(e => e.Username).HasMaxLength(50);
            entity.Property(e => e.Email).HasMaxLength(255);
        });

        // Recording
        modelBuilder.Entity<Recording>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt).IsDescending();
            entity.Property(e => e.Movement).HasMaxLength(10);
            entity.Property(e => e.AudioBlobUrl).HasMaxLength(500);
            entity.Property(e => e.Title).HasMaxLength(100);

            entity.HasOne(e => e.User)
                .WithMany(u => u.Recordings)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Tag
        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name).IsUnique();
            entity.Property(e => e.Name).HasMaxLength(50);
        });

        // RecordingTag
        modelBuilder.Entity<RecordingTag>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.RecordingId);
            entity.HasIndex(e => e.TagId);
            entity.HasIndex(e => new { e.RecordingId, e.TagId }).IsUnique();

            entity.HasOne(e => e.Recording)
                .WithMany(r => r.Tags)
                .HasForeignKey(e => e.RecordingId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Tag)
                .WithMany(t => t.RecordingTags)
                .HasForeignKey(e => e.TagId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.AddedByUser)
                .WithMany(u => u.AddedTags)
                .HasForeignKey(e => e.AddedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Like (composite key)
        modelBuilder.Entity<Like>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.RecordingId });
            entity.HasIndex(e => e.RecordingId);

            entity.HasOne(e => e.User)
                .WithMany(u => u.Likes)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Recording)
                .WithMany(r => r.Likes)
                .HasForeignKey(e => e.RecordingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // UserFollow (composite key)
        modelBuilder.Entity<UserFollow>(entity =>
        {
            entity.HasKey(e => new { e.FollowerId, e.FollowingId });
            entity.HasIndex(e => e.FollowingId);

            entity.HasOne(e => e.Follower)
                .WithMany(u => u.Following)
                .HasForeignKey(e => e.FollowerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Following)
                .WithMany(u => u.Followers)
                .HasForeignKey(e => e.FollowingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // TagFollow (composite key)
        modelBuilder.Entity<TagFollow>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.TagId });

            entity.HasOne(e => e.User)
                .WithMany(u => u.FollowedTags)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Tag)
                .WithMany(t => t.Followers)
                .HasForeignKey(e => e.TagId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
