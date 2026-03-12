cd c:\Users\John\Desktop\dondlingergc.com\JobsiteCalculatorPwa
dotnet publish -c Release -o ../publish_temp
Remove-Item -Recurse -Force ../calc/*
Copy-Item -Recurse ../publish_temp/wwwroot/* ../calc/
