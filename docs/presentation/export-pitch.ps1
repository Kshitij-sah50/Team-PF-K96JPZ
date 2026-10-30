$ErrorActionPreference = 'Stop'
$deck = Join-Path $PSScriptRoot 'Tsukuyomi-Watch-8-Slide-Pitch.pptx'
$pdf = Join-Path $PSScriptRoot 'Tsukuyomi-Watch-8-Slide-Pitch.pdf'
$preview = Join-Path $PSScriptRoot 'preview/pitch'
New-Item -ItemType Directory -Path $preview -Force | Out-Null
$app = New-Object -ComObject PowerPoint.Application
$presentation = $null
try {
    $presentation = $app.Presentations.Open($deck, -1, 0, 0)
    if ($presentation.Slides.Count -ne 8) { throw 'Pitch must contain exactly eight slides.' }
    $presentation.SaveAs($pdf, 32)
    $presentation.Export($preview, 'PNG', 1600, 900)
    Write-Output "Exported $($presentation.Slides.Count)-slide project pitch and PDF."
} finally {
    if ($presentation) { $presentation.Close() }
    $app.Quit()
    if ($presentation) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($presentation) }
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($app)
}
