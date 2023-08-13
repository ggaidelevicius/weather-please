# Remove the 'extension' directory if it exists
$extensionPath = "extension"
if (Test-Path $extensionPath -PathType Container) {
  Remove-Item $extensionPath -Recurse -Force
}

# Replace content in HTML and JS files
Get-ChildItem -Path "out" -File -Include *.html, *.js -Recurse | ForEach-Object {
  $content = Get-Content $_.FullName
  if ($_.Extension -eq ".html") {
    $modifiedContent = $content -replace '/_next/', '/next/'
  }
  elseif ($_.Extension -eq ".js") {
    $modifiedContent = $content -replace '/_next/', '/next/'
  }
  $modifiedContent | Set-Content -Path $_.FullName -Force
}

# Create a new 'extension' directory
New-Item -ItemType Directory -Path $extensionPath

# Move index.html to the 'extension' directory
Move-Item -Path "out\index.html" -Destination $extensionPath

# Move favicon.png to the 'extension' directory
Move-Item -Path "out\favicon.png" -Destination $extensionPath

# Copy 'next' directory contents using robocopy
Robocopy "out\next" "$extensionPath\next" /MIR

# Remove the 'out' directory
Remove-Item "out" -Recurse -Force

# Copy manifest.json to the 'extension' directory
Copy-Item -Path "manifest.json" -Destination 'extension'