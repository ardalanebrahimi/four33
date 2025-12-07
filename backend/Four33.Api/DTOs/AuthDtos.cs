namespace Four33.Api.DTOs;

public record RegisterRequest(
    string Username,
    string Email,
    string Password
);

public record LoginRequest(
    string Email,
    string Password
);

public record GoogleLoginRequest(
    string IdToken
);

public record AppleLoginRequest(
    string IdToken,
    string? FullName // Apple only provides name on first login
);

public record RefreshTokenRequest(
    string RefreshToken
);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserProfileDto User
);

public record SocialTokenValidation(
    bool IsValid,
    string? Email,
    string? GoogleId,
    string? AppleId,
    string? Name
);
