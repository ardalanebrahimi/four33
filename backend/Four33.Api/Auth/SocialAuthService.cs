using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using Four33.Api.DTOs;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Four33.Api.Auth;

public interface ISocialAuthService
{
    Task<SocialTokenValidation> ValidateGoogleTokenAsync(string idToken);
    Task<SocialTokenValidation> ValidateAppleTokenAsync(string idToken);
}

public class SocialAuthService : ISocialAuthService
{
    private readonly GoogleAuthSettings _googleSettings;
    private readonly AppleAuthSettings _appleSettings;
    private readonly HttpClient _httpClient;

    public SocialAuthService(
        IOptions<GoogleAuthSettings> googleSettings,
        IOptions<AppleAuthSettings> appleSettings,
        HttpClient httpClient)
    {
        _googleSettings = googleSettings.Value;
        _appleSettings = appleSettings.Value;
        _httpClient = httpClient;
    }

    public async Task<SocialTokenValidation> ValidateGoogleTokenAsync(string idToken)
    {
        try
        {
            // Verify with Google's tokeninfo endpoint
            var response = await _httpClient.GetAsync(
                $"https://oauth2.googleapis.com/tokeninfo?id_token={idToken}");

            if (!response.IsSuccessStatusCode)
            {
                return new SocialTokenValidation(false, null, null, null, null);
            }

            var content = await response.Content.ReadAsStringAsync();
            var payload = JsonSerializer.Deserialize<GoogleTokenPayload>(content);

            if (payload == null || payload.aud != _googleSettings.ClientId)
            {
                return new SocialTokenValidation(false, null, null, null, null);
            }

            return new SocialTokenValidation(
                IsValid: true,
                Email: payload.email,
                GoogleId: payload.sub,
                AppleId: null,
                Name: payload.name
            );
        }
        catch
        {
            return new SocialTokenValidation(false, null, null, null, null);
        }
    }

    public async Task<SocialTokenValidation> ValidateAppleTokenAsync(string idToken)
    {
        try
        {
            // Fetch Apple's public keys
            var keysResponse = await _httpClient.GetAsync("https://appleid.apple.com/auth/keys");
            var keysContent = await keysResponse.Content.ReadAsStringAsync();
            var keys = JsonSerializer.Deserialize<AppleKeysResponse>(keysContent);

            if (keys?.keys == null)
            {
                return new SocialTokenValidation(false, null, null, null, null);
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadJwtToken(idToken);

            // Find the matching key
            var kid = jwtToken.Header.Kid;
            var matchingKey = keys.keys.FirstOrDefault(k => k.kid == kid);

            if (matchingKey == null)
            {
                return new SocialTokenValidation(false, null, null, null, null);
            }

            // Create RSA key from Apple's JWK
            var rsaParams = new System.Security.Cryptography.RSAParameters
            {
                Modulus = Base64UrlEncoder.DecodeBytes(matchingKey.n),
                Exponent = Base64UrlEncoder.DecodeBytes(matchingKey.e)
            };

            using var rsaKey = System.Security.Cryptography.RSA.Create();
            rsaKey.ImportParameters(rsaParams);

            var validationParams = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = "https://appleid.apple.com",
                ValidateAudience = true,
                ValidAudience = _appleSettings.ClientId,
                ValidateLifetime = true,
                IssuerSigningKey = new RsaSecurityKey(rsaKey)
            };

            tokenHandler.ValidateToken(idToken, validationParams, out _);

            var email = jwtToken.Claims.FirstOrDefault(c => c.Type == "email")?.Value;
            var sub = jwtToken.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;

            return new SocialTokenValidation(
                IsValid: true,
                Email: email,
                GoogleId: null,
                AppleId: sub,
                Name: null // Apple provides name separately on first auth
            );
        }
        catch
        {
            return new SocialTokenValidation(false, null, null, null, null);
        }
    }

    private record GoogleTokenPayload(
        string aud,
        string sub,
        string email,
        string? name
    );

    private record AppleKeysResponse(List<AppleKey> keys);

    private record AppleKey(
        string kty,
        string kid,
        string use,
        string alg,
        string n,
        string e
    );
}
