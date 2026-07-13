using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.JSInterop;

namespace JobsiteCalculatorPwa.Services;

public class AuthService
{
    private const string AuthOrigin = "https://dondlingergc.com";

    private readonly HttpClient _httpClient;
    private readonly CustomAuthStateProvider _authStateProvider;
    private readonly IJSRuntime _jsRuntime;

    public int CurrentBalanceCents { get; private set; } = 0;

    public AuthService(HttpClient httpClient, CustomAuthStateProvider authStateProvider, IJSRuntime jsRuntime)
    {
        _httpClient = httpClient;
        _authStateProvider = authStateProvider;
        _jsRuntime = jsRuntime;
    }

    /// <summary>
    /// Authenticates the user against the central auth gateway.
    /// Uses JSInterop fetch with credentials:'include' so the HttpOnly
    /// refresh cookie is set on the .dondlingergc.com domain.
    /// </summary>
    public async Task<bool> LoginAsync(string email, string password)
    {
        try
        {
            var json = JsonSerializer.Serialize(new { email, password });
            var responseJson = await _jsRuntime.InvokeAsync<string>(
                "authFetch",
                $"{AuthOrigin}/api/auth/login",
                "POST",
                json);

            if (string.IsNullOrEmpty(responseJson))
                return false;

            var result = JsonSerializer.Deserialize<LoginResult>(responseJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (result != null && !string.IsNullOrEmpty(result.Token))
            {
                await _jsRuntime.InvokeVoidAsync("localStorage.setItem", "authToken", result.Token);
                CurrentBalanceCents = result.CreditBalanceCents;
                _authStateProvider.NotifyUserAuthentication(result.Token);
                return true;
            }

            return false;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Registers a new user against the central auth gateway.
    /// </summary>
    public async Task<bool> RegisterAsync(string email, string password)
    {
        try
        {
            var json = JsonSerializer.Serialize(new { email, password });
            var responseJson = await _jsRuntime.InvokeAsync<string>(
                "authFetch",
                $"{AuthOrigin}/api/auth/register",
                "POST",
                json);

            if (string.IsNullOrEmpty(responseJson))
                return false;

            var result = JsonSerializer.Deserialize<LoginResult>(responseJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (result != null && !string.IsNullOrEmpty(result.Token))
            {
                await _jsRuntime.InvokeVoidAsync("localStorage.setItem", "authToken", result.Token);
                CurrentBalanceCents = result.CreditBalanceCents;
                _authStateProvider.NotifyUserAuthentication(result.Token);
                return true;
            }

            return false;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Attempts a silent token refresh using the HttpOnly cookie set on
    /// .dondlingergc.com. Called when localStorage has no JWT but the
    /// cross-subdomain session cookie might still be valid.
    /// Returns the new JWT string or null if refresh failed.
    /// </summary>
    public async Task<string?> TrySilentRefreshAsync()
    {
        try
        {
            var responseJson = await _jsRuntime.InvokeAsync<string>(
                "authFetch",
                $"{AuthOrigin}/api/auth/refresh",
                "POST",
                null);

            if (string.IsNullOrEmpty(responseJson))
                return null;

            using var doc = JsonDocument.Parse(responseJson);
            var newToken = doc.RootElement.GetProperty("token").GetString();

            if (!string.IsNullOrEmpty(newToken))
            {
                await _jsRuntime.InvokeVoidAsync("localStorage.setItem", "authToken", newToken);
                CurrentBalanceCents = doc.RootElement.TryGetProperty("creditBalanceCents", out var bal)
                    ? bal.GetInt32()
                    : CurrentBalanceCents;
                _authStateProvider.NotifyUserAuthentication(newToken);
                return newToken;
            }

            return null;
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Logs the user out locally and revokes the server-side session
    /// by POSTing to the central auth gateway with credentials included.
    /// </summary>
    public async Task Logout()
    {
        try
        {
            // Revoke server-side session (fire-and-forget, don't block logout on network errors)
            await _jsRuntime.InvokeAsync<string>(
                "authFetch",
                $"{AuthOrigin}/api/auth/logout",
                "POST",
                null);
        }
        catch
        {
            // Server-side revocation is best-effort; local cleanup always proceeds
        }

        await _jsRuntime.InvokeVoidAsync("localStorage.removeItem", "authToken");
        _authStateProvider.NotifyUserLogout();
    }
}

public class LoginResult
{
    public string Token { get; set; } = "";
    public int CreditBalanceCents { get; set; }
}
