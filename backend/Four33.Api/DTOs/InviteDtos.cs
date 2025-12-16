using Four33.Api.Data.Entities;
using Four33.Api.Services;

namespace Four33.Api.DTOs;

// Join request submission
public record JoinRequestSubmission(
    string Email,
    string Username,
    string Password,
    string Reason
);

public record JoinRequestDto(
    Guid Id,
    string Email,
    string Username,
    string Reason,
    string Status,
    DateTime CreatedAt,
    DateTime? ReviewedAt,
    UserSummaryDto? ReviewedBy,
    string? ReviewNotes
);

public record JoinRequestStatusResponse(
    string Status,
    string? InviteCode,
    DateTime CreatedAt,
    DateTime? ReviewedAt
);

public record ReviewJoinRequestRequest(
    bool Approved,
    string? Notes
);

// Invite codes
public record InviteCodeDto(
    Guid Id,
    string Code,
    DateTime CreatedAt,
    DateTime ExpiresAt,
    bool IsUsed,
    bool IsExpired,
    bool IsValid,
    UserSummaryDto? UsedBy,
    DateTime? UsedAt
);

public record InviteCodeWithCreatorDto(
    Guid Id,
    string Code,
    DateTime CreatedAt,
    DateTime ExpiresAt,
    bool IsUsed,
    bool IsExpired,
    bool IsValid,
    UserSummaryDto CreatedBy,
    UserSummaryDto? UsedBy,
    DateTime? UsedAt
);

public record RegisterWithInviteRequest(
    string InviteCode,
    string Username,
    string Email,
    string Password
);

public record ValidateInviteResponse(
    bool Valid,
    string? Message
);

// Admin user management
public record AdminUserDto(
    Guid Id,
    string Username,
    string Email,
    bool IsAdmin,
    int InvitesRemaining,
    int RecordingsCount,
    int FollowersCount,
    DateTime CreatedAt,
    UserSummaryDto? InvitedBy
);

public record UpdateUserAdminRequest(
    bool? IsAdmin,
    int? InvitesRemaining
);

public record AdminStatsDto(
    int TotalUsers,
    int TotalRecordings,
    int PendingRequests,
    int TotalInviteCodes,
    int UsedInviteCodes
);

// Mapper extensions
public static class InviteDtoExtensions
{
    public static JoinRequestDto ToDto(this JoinRequest request)
    {
        return new JoinRequestDto(
            Id: request.Id,
            Email: request.Email,
            Username: request.Username,
            Reason: request.Reason,
            Status: request.Status.ToString(),
            CreatedAt: request.CreatedAt,
            ReviewedAt: request.ReviewedAt,
            ReviewedBy: request.ReviewedBy?.ToSummaryDto(),
            ReviewNotes: request.ReviewNotes
        );
    }

    public static InviteCodeDto ToDto(this InviteCode code)
    {
        return new InviteCodeDto(
            Id: code.Id,
            Code: code.Code,
            CreatedAt: code.CreatedAt,
            ExpiresAt: code.ExpiresAt,
            IsUsed: code.IsUsed,
            IsExpired: code.IsExpired,
            IsValid: code.IsValid,
            UsedBy: code.UsedBy?.ToSummaryDto(),
            UsedAt: code.UsedAt
        );
    }

    public static InviteCodeWithCreatorDto ToDtoWithCreator(this InviteCode code)
    {
        return new InviteCodeWithCreatorDto(
            Id: code.Id,
            Code: code.Code,
            CreatedAt: code.CreatedAt,
            ExpiresAt: code.ExpiresAt,
            IsUsed: code.IsUsed,
            IsExpired: code.IsExpired,
            IsValid: code.IsValid,
            CreatedBy: code.CreatedBy.ToSummaryDto(),
            UsedBy: code.UsedBy?.ToSummaryDto(),
            UsedAt: code.UsedAt
        );
    }

    public static AdminUserDto ToAdminDto(this User user)
    {
        return new AdminUserDto(
            Id: user.Id,
            Username: user.Username,
            Email: user.Email,
            IsAdmin: user.IsAdmin,
            InvitesRemaining: user.InvitesRemaining,
            RecordingsCount: user.Recordings?.Count ?? 0,
            FollowersCount: user.Followers?.Count ?? 0,
            CreatedAt: user.CreatedAt,
            InvitedBy: user.InvitedBy?.ToSummaryDto()
        );
    }
}
