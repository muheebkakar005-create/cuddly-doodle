Add-Type -AssemblyName System.Drawing

function Resize-Image($srcPath, $destPath, $targetWidth, $targetHeight, $paddingRatio) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $bmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#0C0C0E'))
    $g.FillRectangle($brush, 0, 0, $targetWidth, $targetHeight)
    
    $padW = [int]($targetWidth * $paddingRatio)
    $padH = [int]($targetHeight * $paddingRatio)
    $drawW = $targetWidth - (2 * $padW)
    $drawH = $targetHeight - (2 * $padH)
    
    $scale = [Math]::Min($drawW / $src.Width, $drawH / $src.Height)
    $finalW = [int]($src.Width * $scale)
    $finalH = [int]($src.Height * $scale)
    $posX = [int](($targetWidth - $finalW) / 2)
    $posY = [int](($targetHeight - $finalH) / 2)
    
    $g.DrawImage($src, $posX, $posY, $finalW, $finalH)
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $src.Dispose()
}

$source = Resolve-Path "public\logo-app.png"
if (-not (Test-Path "public\icons")) { New-Item -ItemType Directory -Path "public\icons" }

Resize-Image $source (Join-Path (Get-Location) "public\icons\icon-192.png") 192 192 0.04
Resize-Image $source (Join-Path (Get-Location) "public\icons\icon-512.png") 512 512 0.04
Resize-Image $source (Join-Path (Get-Location) "public\icons\icon-maskable-512.png") 512 512 0.15
Resize-Image $source (Join-Path (Get-Location) "public\icons\icon-maskable-192.png") 192 192 0.15
Resize-Image $source (Join-Path (Get-Location) "public\apple-touch-icon.png") 180 180 0.04
Write-Output "PWA icons generated successfully"
