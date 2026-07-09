# archive_stale_files.ps1
$archiveDir = "_workspace_archive"

# Create archive directory if it doesn't exist
if (!(Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir | Out-Null
    Write-Output "Created directory $archiveDir"
}

# List of files to move
$files = @(
    "inject_v4.js", "rebuild.js", "temp.js", "test.js", "scratch2.js", "scratch3.js", 
    "refine_swipe_deck.py", "update_telemetry_swipe.py", "rewrite_forecast.py", "fix_js.py",
    "desktop-v1.html", "supermobile.html", "www_index.html", "www_index_backup.html", 
    "irritated_revamp_index.html", "samples_index.html", "webtest1_index.html", "about.html", 
    "contact.html", "store.html", "fortress.html", "cottonthimble.html", "chat.html",
    "functions/weather-ai.js", "components/history-modal.js", "components/user-profile.js", 
    "js/bridge-client.js"
)

# List of folders to move
$folders = @(
    "mobilestatic", "TestConsole", "TestConsole10", "TestScript"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        # Determine target path maintaining folder structure inside archive
        $targetPath = Join-Path $archiveDir (Split-Path $file -Parent)
        if (!(Test-Path $targetPath)) {
            New-Item -ItemType Directory -Path $targetPath | Out-Null
        }
        Move-Item -Path $file -Destination $targetPath -Force
        Write-Output "Moved file: $file -> $targetPath"
    }
}

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        $targetPath = Join-Path $archiveDir $folder
        if (Test-Path $targetPath) {
            Remove-Item -Path $targetPath -Recurse -Force | Out-Null
        }
        Move-Item -Path $folder -Destination $archiveDir -Force
        Write-Output "Moved folder: $folder -> $archiveDir"
    }
}

Write-Output "Stabilization Complete."
