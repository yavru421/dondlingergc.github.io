using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.AspNetCore.Components.Authorization;
using JobsiteCalculatorPwa;
using JobsiteCalculatorPwa.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddSingleton<ConstructionMathService>();
builder.Services.AddSingleton<ConcreteMathEngine>();

// Auth services — CustomAuthStateProvider registered as singleton instance
// so both the interface and concrete type resolve to the same object.
builder.Services.AddAuthorizationCore();
builder.Services.AddScoped<CustomAuthStateProvider>();
builder.Services.AddScoped<AuthenticationStateProvider>(sp => sp.GetRequiredService<CustomAuthStateProvider>());
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<WebRtcSyncService>();

var host = builder.Build();

// Wire the circular dependency: AuthService needs CustomAuthStateProvider (done via DI),
// and CustomAuthStateProvider needs AuthService (done via property injection after build).
var authStateProvider = host.Services.GetRequiredService<CustomAuthStateProvider>();
var authService = host.Services.GetRequiredService<AuthService>();
authStateProvider.AuthService = authService;

await host.RunAsync();
