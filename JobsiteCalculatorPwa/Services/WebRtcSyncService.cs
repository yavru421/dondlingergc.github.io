using System;
using System.Threading.Tasks;
using Microsoft.JSInterop;

namespace JobsiteCalculatorPwa.Services
{
    public class WebRtcSyncService
    {
        private readonly IJSRuntime _jsRuntime;

        public WebRtcSyncService(IJSRuntime jsRuntime)
        {
            _jsRuntime = jsRuntime;
        }

        public async Task InitializeAsync()
        {
            // Initialize WebRTC data channels
            await _jsRuntime.InvokeVoidAsync("zlaSync.init");
        }

        public async Task SendAsync(string message)
        {
            // Send message through WebRTC data channels
            await _jsRuntime.InvokeVoidAsync("zlaSync.send", message);
        }

        public async Task<string> ReceiveAsync()
        {
            // Receive message through WebRTC data channels
            return await _jsRuntime.InvokeAsync<string>("zlaSync.receive");
        }
    }
}
