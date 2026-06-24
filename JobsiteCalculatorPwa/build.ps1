cd c:\Users\John\Desktop\dondlingergc.com\JobsiteCalculatorPwa
if (Test-Path ../publish_temp) { Remove-Item -Recurse -Force ../publish_temp }
dotnet publish -c Release -o ../publish_temp
Remove-Item -Recurse -Force ../calc/*
Copy-Item -Recurse ../publish_temp/wwwroot/* ../calc/
