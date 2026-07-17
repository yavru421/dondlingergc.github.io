using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Components.WebAssembly.Authentication;
using Microsoft.JSInterop;

public class WebRtcSyncService
{
    private readonly IJSRuntime _jsRuntime;
    private readonly ConcurrentQueue<SyncEvent> _syncEventQueue;

    public WebRtcSyncService(IJSRuntime jsRuntime)
    {
        _jsRuntime = jsRuntime;
        _syncEventQueue = new ConcurrentQueue<SyncEvent>();
    }

    public async Task EnqueueSyncEventAsync(SyncEvent syncEvent)
    {
        _syncEventQueue.Enqueue(syncEvent);
        await TriggerJsSendAsync();
    }

    private async Task TriggerJsSendAsync()
    {
        if (_syncEventQueue.TryDequeue(out var syncEvent))
        {
            await _jsRuntime.InvokeVoidAsync("zlaSync.send", syncEvent.Data);
        }
    }

    public async Task InitializeAsync()
    {
        await _jsRuntime.InvokeVoidAsync("zlaSync.init");
    }
}

public class SyncEvent
{
    public string Data { get; set; }
}
