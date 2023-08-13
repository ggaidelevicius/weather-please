param(
  [string]$manifestPath = "manifest.json",
  [string]$packagePath = "package.json",
  [string]$releaseType
)

# Check if $releaseType parameter is provided
if (-not $releaseType) {
  $releaseType = Read-Host "Enter the release type ('major', 'minor', or 'patch')"
}

# Validate the provided release type
if ($releaseType -notin @('major', 'minor', 'patch')) {
  Write-Host "Error: Invalid release type. Use 'major', 'minor', or 'patch'."
  exit
}

# Read the content of the manifest.json file
$manifestContent = Get-Content -Path $manifestPath -Raw | ConvertFrom-Json

# Read the content of the package.json file
$packageContent = Get-Content -Path $packagePath -Raw | ConvertFrom-Json

# Get the current version from manifest.json
$currentVersion = $manifestContent.version

# Split the current version into major, minor, and patch parts
$major, $minor, $patch = $currentVersion -split '\.'

# Cast version parts to integers
$major = [int]$major
$minor = [int]$minor
$patch = [int]$patch

# Determine the new version based on the release type
switch ($releaseType) {
  "major" { $major++; $minor = 0; $patch = 0 }
  "minor" { $minor++; $patch = 0 }
  "patch" { $patch++ }
}

$newVersion = "$major.$minor.$patch"

# Update the version attribute in manifest.json
$manifestContent.version = $newVersion

# Update the version attribute in package.json
$packageContent.version = $newVersion

# Convert back to JSON format for manifest.json
$updatedManifestContent = $manifestContent | ConvertTo-Json -Depth 4

# Convert back to JSON format for package.json
$updatedPackageContent = $packageContent | ConvertTo-Json -Depth 4

# Save the updated content back to manifest.json
$updatedManifestContent | Set-Content -Path $manifestPath

# Save the updated content back to package.json
$updatedPackageContent | Set-Content -Path $packagePath

# Copy manifest.json to the 'extension' directory
Copy-Item -Path "manifest.json" -Destination 'extension'

Write-Host "Version in manifest.json and package.json updated to: $newVersion"
