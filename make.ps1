param(
	[string] $Command
)

$ErrorActionPreference = "Stop";

$FrontEndPath = $PSScriptRoot + "\\crates\\plaza-client";
$BackEndPath = $PSScriptRoot;

$env:DATABASE_URL = 'postgresql://postgres:Confilogi89@127.0.0.1:5432/plaza';

if ($Command -eq "watch-backend") {
	Set-Location $BackEndPath;
	cargo watch -x "run -- --db-host 127.0.0.1 --db-port 5432 --db-username postgres --db-password Confilogi89 --db-database plaza";
} elseif ($Command -eq "watch-frontend") {
	Set-Location $FrontEndPath;
	trunk serve;
} elseif ($Command -eq "watch-frontend-css") {
	Set-Location $FrontEndPath;
	npx @tailwindcss/cli -i .\index.css -o .\assets\output.css --watch
} elseif ($Command -eq "reset-database") {
	Set-Location $BackEndPath;
	cargo sqlx database reset;
} else {
	Write-Host "Available commands: 'watch-backend', 'watch-frontend', 'watch-frontend-css', 'reset-database'"
}
