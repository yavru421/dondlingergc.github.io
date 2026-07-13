using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.JSInterop;

namespace JobsiteCalculatorPwa.Services;

public class CustomAuthStateProvider : AuthenticationStateProvider
{
    private readonly IJSRuntime _jsRuntime;
    private readonly HttpClient _httpClient;
    private ClaimsPrincipal _anonymous = new ClaimsPrincipal(new ClaimsIdentity());

    /// <summary>
    /// Lazy-resolved reference to AuthService, injected after construction
    /// to break the circular dependency (AuthService ↔ CustomAuthStateProvider).
    /// Set by DI registration or manually after both services are constructed.
    /// </summary>
    public AuthService? AuthService { get; set; }

    public CustomAuthStateProvider(IJSRuntime jsRuntime, HttpClient httpClient)
    {
        _jsRuntime = jsRuntime;
        _httpClient = httpClient;
    }

    public override async Task<AuthenticationState> GetAuthenticationStateAsync()
    {
        try
        {
            var token = await _jsRuntime.InvokeAsync<string>("localStorage.getItem", "authToken");

            // If no token in localStorage, attempt a silent refresh using the
            // cross-subdomain HttpOnly cookie. This is the handshake that makes
            // sessions survive navigation between *.dondlingergc.com subdomains.
            if (string.IsNullOrWhiteSpace(token))
            {
                if (AuthService != null)
                {
                    token = await AuthService.TrySilentRefreshAsync();
                }

                if (string.IsNullOrWhiteSpace(token))
                {
                    return new AuthenticationState(_anonymous);
                }
            }

            var claims = ParseClaimsFromJwt(token);
            var expiry = claims.FirstOrDefault(c => c.Type == "exp")?.Value;
            
            if (expiry != null && DateTimeOffset.FromUnixTimeSeconds(long.Parse(expiry)) <= DateTimeOffset.UtcNow)
            {
                // Token expired — try cookie-based refresh before falling back to anonymous
                if (AuthService != null)
                {
                    token = await AuthService.TrySilentRefreshAsync();
                }

                if (string.IsNullOrWhiteSpace(token))
                {
                    await ClearAuthData();
                    return new AuthenticationState(_anonymous);
                }

                claims = ParseClaimsFromJwt(token);
            }

            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            var identity = new ClaimsIdentity(claims, "jwt");
            return new AuthenticationState(new ClaimsPrincipal(identity));
        }
        catch
        {
            return new AuthenticationState(_anonymous);
        }
    }

    public void NotifyUserAuthentication(string token)
    {
        var claims = ParseClaimsFromJwt(token);
        var identity = new ClaimsIdentity(claims, "jwt");
        var user = new ClaimsPrincipal(identity);
        var state = Task.FromResult(new AuthenticationState(user));
        NotifyAuthenticationStateChanged(state);
    }

    public void NotifyUserLogout()
    {
        var state = Task.FromResult(new AuthenticationState(_anonymous));
        NotifyAuthenticationStateChanged(state);
    }

    private async Task ClearAuthData()
    {
        await _jsRuntime.InvokeVoidAsync("localStorage.removeItem", "authToken");
        _httpClient.DefaultRequestHeaders.Authorization = null;
    }

    private IEnumerable<Claim> ParseClaimsFromJwt(string jwt)
    {
        var payload = jwt.Split('.')[1];
        var jsonBytes = ParseBase64WithoutPadding(payload);
        var keyValuePairs = JsonSerializer.Deserialize<Dictionary<string, object>>(jsonBytes);
        return keyValuePairs?.Select(kvp => new Claim(kvp.Key, kvp.Value.ToString() ?? string.Empty)) ?? Enumerable.Empty<Claim>();
    }

    private byte[] ParseBase64WithoutPadding(string base64)
    {
        switch (base64.Length % 4)
        {
            case 2: base64 += "=="; break;
            case 3: base64 += "="; break;
        }
        return Convert.FromBase64String(base64);
    }
}
