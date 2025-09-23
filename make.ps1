param(
	[string] $Command
)

$ErrorActionPreference = "Stop";

$FrontEndPath = $PSScriptRoot + "\\crates\\pure-plaza-client";
$BackEndPath = $PSScriptRoot;

$env:DATABASE_URL = 'postgresql://postgres:Confilogi89@127.0.0.1:5432/plaza';

if ($Command -eq "watch-backend") {
	$CommandArgs = "run -- --db-host 127.0.0.1 --db-port 5432 --db-username postgres --db-password Confilogi89 --db-database plaza --intranet-api-key " + $env:INTRANET_API_KEY + " --ms-tenant-id " + $env:PLAZA_MS_TENANT_ID + " --ms-client-id " + $env:PLAZA_MS_CLIENT_ID + " --ms-client-secret " + $env:PLAZA_MS_CLIENT_SECRET + " --ms-redirection-uri https://dev.plaza.local/api/microsoft/callback --frontend-base-url https://dev.plaza.local/";

	Set-Location $BackEndPath;
	cargo watch -c --quiet --ignore "**/*.html" --ignore '**/*.css' --ignore "**/*.js" -x $CommandArgs;
} elseif ($Command -eq "watch-frontend-css") {
	Set-Location $FrontEndPath;
	npx @tailwindcss/cli -i .\tailwind-input.css -o .\tailwind.css --watch
} elseif ($Command -eq "reset-database") {
	Set-Location $BackEndPath;
	cargo sqlx database reset;
} else {
	Write-Host "Available commands: 'watch-backend', 'watch-frontend-css', 'reset-database'"
}
