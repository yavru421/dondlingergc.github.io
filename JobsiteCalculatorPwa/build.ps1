cd c:\Users\John\Desktop\dondlingergc.com\JobsiteCalculatorPwa
if (Test-Path ../publish_temp) { Remove-Item -Recurse -Force ../publish_temp }
dotnet publish -c Release -o ../publish_temp

# [Antigravity Override] Prevent build.ps1 from overwriting the root 3-plate index.html

if (Test-Path ../_framework) { Remove-Item -Recurse -Force ../_framework }

Copy-Item -Recurse -Force ../publish_temp/wwwroot/* ../
