param(
    [ValidateSet("standalone", "portable", "all", "clean")]
    [string]$Target = "all",
    [string]$Version = "1.0.0"
)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = $PSScriptRoot
Set-Location $WorkspaceRoot

function Find-ISCC {
    $cmd = Get-Command iscc.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $knownPaths = @(
        "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
        "C:\Program Files\Inno Setup 6\ISCC.exe",
        "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe",
        "$env:LOCALAPPDATA\Programs\Antigravity IDE\_\resources\app\node_modules\innosetup\bin\ISCC.exe"
    )
    foreach ($p in $knownPaths) {
        if (Test-Path $p) { return $p }
    }

    # Cari secara rekursif di LocalAppData jika belum ketemu
    $found = Get-ChildItem -Path "$env:LOCALAPPDATA\Programs" -Filter "ISCC.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { return $found.FullName }

    return $null
}

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "    YOUTUBE DESKTOP - BUILD & PACKAGING SYSTEM       " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Target Build: $Target`n" -ForegroundColor Yellow

$DistDir = Join-Path $WorkspaceRoot "dist"
$BinDir = Join-Path $WorkspaceRoot "build\bin"
$ExeName = "YouTubeDESK.exe"

# 1. Bersihkan jika diminta
if ($Target -eq "clean") {
    Write-Host "[1/1] Membersihkan folder dist dan build\bin..." -ForegroundColor Yellow
    if (Test-Path $DistDir) { Remove-Item -Recurse -Force $DistDir }
    $mainExe = Join-Path $BinDir $ExeName
    if (Test-Path $mainExe) { Remove-Item -Force $mainExe }
    Write-Host "Pembersihan selesai!`n" -ForegroundColor Green
    exit 0
}

# 2. Build Frontend
Write-Host "[1/4] Membangun Frontend (Vite + React)..." -ForegroundColor Yellow
Set-Location (Join-Path $WorkspaceRoot "frontend")
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Gagal membangun frontend!" -ForegroundColor Red
    exit 1
}
Set-Location $WorkspaceRoot

# 3. Build Wails Executable
Write-Host "`n[2/4] Mengompilasi binary Wails (Embedded Assets)..." -ForegroundColor Yellow
wails build -platform windows/amd64
if ($LASTEXITCODE -ne 0) {
    Write-Host "Gagal mengompilasi Wails executable!" -ForegroundColor Red
    exit 1
}

$builtExe = Join-Path $BinDir $ExeName
if (-not (Test-Path $builtExe)) {
    Write-Host "File executable tidak ditemukan di: $builtExe" -ForegroundColor Red
    exit 1
}

# Pastikan folder dist ada
if (-not (Test-Path $DistDir)) {
    New-Item -ItemType Directory -Path $DistDir | Out-Null
}

# 4. Packaging Versi Standalone (Inno Setup Installer Pack)
if ($Target -eq "standalone" -or $Target -eq "all") {
    Write-Host "`n[3/4] Mengompilasi Versi STANDALONE INSTALLER (Inno Setup)..." -ForegroundColor Yellow
    $standaloneDir = Join-Path $DistDir "standalone"
    if (-not (Test-Path $standaloneDir)) {
        New-Item -ItemType Directory -Path $standaloneDir | Out-Null
    }

    # Salin juga binary standalone langsung
    Copy-Item -Path $builtExe -Destination (Join-Path $standaloneDir $ExeName) -Force

    # Cari Inno Setup Compiler (ISCC)
    $isccPath = Find-ISCC
    if (-not $isccPath) {
        Write-Host "  [PERINGATAN] Inno Setup Compiler (ISCC.exe) tidak ditemukan!" -ForegroundColor Red
        Write-Host "  Silakan pasang Inno Setup 6 dari https://jrsoftware.org/isdl.php" -ForegroundColor Red
    } else {
        Write-Host "  -> Menggunakan Inno Setup Compiler: $isccPath" -ForegroundColor DarkCyan
        $cleanVer = $Version.TrimStart('v')
        & $isccPath "/DMyAppVersion=$cleanVer" $issFile
        if ($LASTEXITCODE -eq 0) {
            $installerExe = Get-ChildItem -Path $standaloneDir -Filter "*Installer*.exe" | Select-Object -First 1
            if ($installerExe) {
                $installerSize = [math]::Round($installerExe.Length / 1MB, 2)
                Write-Host "  -> Standalone Installer: $($installerExe.FullName) ($installerSize MB)" -ForegroundColor Green
            }
        } else {
            Write-Host "  Gagal mengompilasi installer dengan Inno Setup!" -ForegroundColor Red
        }
    }

    $standaloneReadme = @"
=====================================================
 YouTube Desktop - Versi Standalone Installer
=====================================================

File Installer Pack:
  YouTubeDESK-Installer-v1.0.0.exe

Fitur Installer (Inno Setup):
- Wizard instalasi modern (Pilihan install Semua Pengguna atau Khusus Akun).
- Membuat shortcut di Desktop dan Start Menu secara otomatis.
- Terdaftar di Windows Apps & Features / Control Panel dengan uninstaller resmi.
- Sudah memaketkan engine yt-dlp & FFmpeg (Instalasi Lengkap) agar aplikasi
  langsung bisa digunakan secara offline tanpa download tambahan.
=====================================================
"@
    Set-Content -Path (Join-Path $standaloneDir "README-INSTALLER.txt") -Value $standaloneReadme -Encoding UTF8
    Write-Host "  -> Selesai dikemas ke: $standaloneDir" -ForegroundColor Green
}

# 5. Packaging Versi Portable
if ($Target -eq "portable" -or $Target -eq "all") {
    Write-Host "`n[4/4] Mengemas Versi PORTABLE (Full Offline Bundle)..." -ForegroundColor Yellow
    $portableBaseDir = Join-Path $DistDir "portable"
    $portablePackageDir = Join-Path $portableBaseDir "YouTubeDESK-Portable"

    if (Test-Path $portablePackageDir) {
        Remove-Item -Recurse -Force $portablePackageDir
    }
    New-Item -ItemType Directory -Path $portablePackageDir -Force | Out-Null

    # Copy binary utama
    Copy-Item -Path $builtExe -Destination (Join-Path $portablePackageDir $ExeName) -Force

    # Pastikan yt-dlp.exe, ffmpeg.exe, dan ffprobe.exe ada
    $ytdlpSrc = Join-Path $BinDir "yt-dlp.exe"
    $ffmpegSrc = Join-Path $BinDir "ffmpeg.exe"
    $ffprobeSrc = Join-Path $BinDir "ffprobe.exe"

    if (Test-Path $ytdlpSrc) {
        Copy-Item -Path $ytdlpSrc -Destination (Join-Path $portablePackageDir "yt-dlp.exe") -Force
    } else {
        Write-Host "  [PERINGATAN] yt-dlp.exe tidak ditemukan di build\bin. Mengunduh yt-dlp terbaru..." -ForegroundColor DarkYellow
        Invoke-WebRequest -Uri "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" -OutFile (Join-Path $portablePackageDir "yt-dlp.exe")
    }

    if (Test-Path $ffmpegSrc) {
        Copy-Item -Path $ffmpegSrc -Destination (Join-Path $portablePackageDir "ffmpeg.exe") -Force
    }

    if (Test-Path $ffprobeSrc) {
        Copy-Item -Path $ffprobeSrc -Destination (Join-Path $portablePackageDir "ffprobe.exe") -Force
    }

    $portableReadme = @"
=====================================================
 YouTube Desktop - Versi Portable (Full Offline)
=====================================================

Versi Portable adalah paket lengkap siap pakai (Zero-Setup / Plug & Play).

Fitur & Keunggulan:
- Sudah dilengkapi engine yt-dlp, ffmpeg, dan ffprobe secara offline.
- Tidak membutuhkan instalasi atau download tambahan saat pertama dibuka.
- Bebas dipindahkan ke USB Flashdisk / Drive eksternal dan langsung jalan
  di laptop / PC Windows mana pun.

Cara Penggunaan:
1. Ekstrak seluruh isi folder ini jika masih dalam format ZIP.
2. Klik dua kali pada 'YouTubeDESK.exe' untuk menjalankan aplikasi.
=====================================================
"@
    Set-Content -Path (Join-Path $portablePackageDir "PETUNJUK-PORTABLE.txt") -Value $portableReadme -Encoding UTF8

    # Buat file ZIP portable
    $zipPath = Join-Path $portableBaseDir "YouTubeDESK-Portable.zip"
    if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
    
    Write-Host "  -> Mengompresi folder portable ke file ZIP..." -ForegroundColor Cyan
    Compress-Archive -Path "$portablePackageDir\*" -DestinationPath $zipPath -CompressionLevel Optimal

    $zipSize = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
    Write-Host "  -> Portable Folder : $portablePackageDir" -ForegroundColor Green
    Write-Host "  -> Portable ZIP    : $zipPath ($zipSize MB)" -ForegroundColor Green
}

Write-Host "`n=====================================================" -ForegroundColor Cyan
Write-Host "            SEMUA PROSES BUILD SELESAI!              " -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Hasil dapat ditemukan di folder 'dist\':" -ForegroundColor White
if (Test-Path (Join-Path $DistDir "standalone\YouTubeDESK-Installer-v1.0.0.exe")) {
    Write-Host "  [STANDALONE INSTALLER] dist\standalone\YouTubeDESK-Installer-v1.0.0.exe" -ForegroundColor White
}
if (Test-Path (Join-Path $DistDir "portable\YouTubeDESK-Portable.zip")) {
    Write-Host "  [PORTABLE ZIP]         dist\portable\YouTubeDESK-Portable.zip" -ForegroundColor White
    Write-Host "  [PORTABLE FOLDER]      dist\portable\YouTubeDESK-Portable\" -ForegroundColor White
}
Write-Host "=====================================================`n" -ForegroundColor Cyan
