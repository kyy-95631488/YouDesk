; Script generated for Inno Setup 6
#define MyAppName "YouTube Desktop"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "kyy-95631488"
#define MyAppURL "https://github.com/kyy-95631488/YouTubeDESK"
#define MyAppExeName "YouTubeDESK.exe"

[Setup]
AppId={{D37F8E9C-A25B-4C61-9A34-5A384A9508BC}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} v{#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
UninstallDisplayIcon={app}\{#MyAppExeName}
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
DisableProgramGroupPage=yes
PrivilegesRequiredOverridesAllowed=dialog commandline
OutputDir=dist\standalone
OutputBaseFilename=YouTubeDESK-Installer-v1.0.0
SetupIconFile=build\windows\icon.ico
SolidCompression=yes
Compression=lzma2/ultra64
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Types]
Name: "full"; Description: "Instalasi Lengkap (Direkomendasikan - Termasuk engine yt-dlp & FFmpeg offline)"
Name: "compact"; Description: "Instalasi Kompak (Hanya aplikasi YouTube Desktop)"
Name: "custom"; Description: "Instalasi Kustom"; Flags: iscustom

[Components]
Name: "app"; Description: "YouTube Desktop Core Application"; Types: full compact custom; Flags: fixed
Name: "engines"; Description: "Engine yt-dlp & FFmpeg (Mendukung download audio/video instan secara offline)"; Types: full

[Files]
Source: "build\bin\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion; Components: app
Source: "build\bin\yt-dlp.exe"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist; Components: engines
Source: "build\bin\ffmpeg.exe"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist; Components: engines
Source: "build\bin\ffprobe.exe"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist; Components: engines

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
