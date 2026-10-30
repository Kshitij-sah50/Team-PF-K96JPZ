param([string]$Directory = $PSScriptRoot)
$ErrorActionPreference = 'Stop'
$resolved = (Resolve-Path -LiteralPath $Directory).Path
$deck = Join-Path $resolved 'Tsukuyomi-Watch-Judging-Deck.pptx'
$pdf = Join-Path $resolved 'Tsukuyomi-Watch-Judging-Deck.pdf'
$previews = Join-Path $resolved 'preview'
New-Item -ItemType Directory -Path $previews -Force | Out-Null
$app = New-Object -ComObject PowerPoint.Application
$presentation = $null
try {
    $presentation = $app.Presentations.Open($deck, -1, 0, 0)
    $presentation.SaveAs($pdf, 32)
    $presentation.Export($previews, 'PNG', 1600, 900)
    Write-Output "Exported $($presentation.Slides.Count) slides and PDF."
} finally {
    if ($presentation) { $presentation.Close() }
    $app.Quit()
    if ($presentation) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($presentation) }
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($app)
}
