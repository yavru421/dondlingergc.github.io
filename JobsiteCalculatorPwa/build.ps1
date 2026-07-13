cd c:\Users\John\Desktop\dondlingergc.com\JobsiteCalculatorPwa
if (Test-Path ../publish_temp) { Remove-Item -Recurse -Force ../publish_temp }
dotnet publish -c Release -o ../publish_temp

if (Test-Path ../index.html) {
    if (-not (Test-Path ../_workspace_archive)) { New-Item -ItemType Directory -Path ../_workspace_archive }
    Move-Item -Force ../index.html ../_workspace_archive/index.html
}

if (Test-Path ../_framework) { Remove-Item -Recurse -Force ../_framework }

Copy-Item -Recurse -Force ../publish_temp/wwwroot/* ../
