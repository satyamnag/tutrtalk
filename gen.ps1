$root = "D:\tutrtalk-livekit-22052026\agent-starter-react"
$out = Join-Path $root "agent-starter-react.txt"
if (Test-Path $out) { Remove-Item $out -Force }
$files = Get-ChildItem $root -Recurse -File | Where-Object {
    $_.FullName -notmatch 'node_modules|\.next|\.git|\.env|package-lock\.json|pnpm-lock\.yaml|fonts[/\\]|public[/\\]|\.ico$' -and
    $_.Extension -match '\.(ts|tsx|js|mjs|json|css|yaml|txt|md)$' -and
    $_.Name -notin @('LICENSE','README.md','TEMPLATE.md','next-env.d.ts','agent-starter-react.txt')
} | Sort-Object FullName
foreach ($f in $files) {
    $rel = [System.IO.Path]::GetRelativePath($root, $f.FullName)
    "========================================================" | Out-File $out -Append -Encoding utf8
    "PATH: $rel" | Out-File $out -Append -Encoding utf8
    "========================================================" | Out-File $out -Append -Encoding utf8
    Get-Content $f.FullName -Raw | Out-File $out -Append -Encoding utf8
}
Write-Host "Done! Files: $($files.Count)"
