<#
reset-git-history.ps1
Interactive PowerShell script to backup a repo (mirror) and reset local Git history to a single clean commit.
Usage examples:
  .\reset-git-history.ps1            # interactive prompts
  .\reset-git-history.ps1 -ForcePush -Branch main -RemoteUrl "https://github.com/you/new-repo.git"
#>
param(
    [switch]$ForcePush,
    [string]$RemoteUrl,
    [string]$Branch = "main"
)

function Ask-Yes {
    param([string]$Message)
    $r = Read-Host "$Message [y/N]"
    return ($r -eq 'y' -or $r -eq 'Y')
}

# Ensure git is available
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git no está instalado o no está en PATH. Instala Git antes de continuar."
    exit 1
}

Push-Location (Get-Location)

# Detect current origin
$curOrigin = $null
try { $curOrigin = (git remote get-url origin 2>$null).Trim() } catch {}

if (-not $RemoteUrl) { $RemoteUrl = $curOrigin }

Write-Host "Remote detected: $RemoteUrl"

if (-not $RemoteUrl) {
    $RemoteUrl = Read-Host "No se detectó remote. Introduce la URL del repo remoto para el backup (o deja vacío para saltar backup)"
    if ([string]::IsNullOrWhiteSpace($RemoteUrl)) { $RemoteUrl = $null }
}

# Backup (mirror)
if ($RemoteUrl) {
    $doBackup = (Ask-Yes "Crear backup espejo (--mirror) del remoto en carpeta padre?")
    if ($doBackup) {
        $repoName = ([IO.Path]::GetFileNameWithoutExtension($RemoteUrl) -replace '\.git$','')
        if (-not $repoName) { $repoName = (Get-Item .).Name }
        $backupPath = Join-Path (Get-Item ..).FullName "$repoName-backup.git"
        Write-Host "Creando backup espejo en: $backupPath"
        git clone --mirror $RemoteUrl $backupPath
        if ($LASTEXITCODE -ne 0) { Write-Warning "El backup espejo falló. Revisa la URL o permisos." }
    }
}

# Confirm destructive action
Write-Host "\nADVERTENCIA: Esto eliminará el historial local (la carpeta .git)."
if (-not (Ask-Yes "Continuar y reinicializar el historial local?")) {
    Write-Host "Cancelado por usuario."
    Pop-Location
    exit 0
}

# Remove .git
if (Test-Path .git) {
    Write-Host "Eliminando .git..."
    Remove-Item -Recurse -Force .git
} else {
    Write-Host "No existe .git en este directorio, continuar."
}

# Reinit and clean commit
Write-Host "Inicializando repo limpio..."
git init
git add -A
git commit -m "Initial clean commit" --allow-empty

# Set branch name
try {
    git branch -M $Branch
} catch {
    Write-Warning "No se pudo renombrar la rama por defecto. Puedes renombrarla manualmente a '$Branch'."
}

# Configure remote
if ($RemoteUrl) {
    Write-Host "Configurando remote origin: $RemoteUrl"
    # Remove existing origin if any
    try { git remote remove origin 2>$null } catch {}
    git remote add origin $RemoteUrl
} else {
    if (Ask-Yes "¿Quieres añadir un remote ahora?") {
        $u = Read-Host "Introduce la URL del remote"
        if (-not [string]::IsNullOrWhiteSpace($u)) {
            git remote add origin $u
            $RemoteUrl = $u
        }
    }
}

# Push
if ($RemoteUrl) {
    if (-not $ForcePush) {
        $doPush = (Ask-Yes "¿Hacer push al remote '$RemoteUrl'? (si el remote tiene protección, el push puede fallar)")
    } else { $doPush = $true }

    if ($doPush) {
        if ($ForcePush -or (Ask-Yes "Forzar push y sobrescribir remoto? (WARNING: destruye historial remoto)")) {
            Write-Host "Pushing --force to origin/$Branch..."
            git push -u --force origin $Branch
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Push falló. Revisa protección de ramas o permisos en el remoto."
            }
        } else {
            Write-Host "Haciendo push normal a origin/$Branch"
            git push -u origin $Branch
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Push falló. Revisa la protección de ramas o crea un PR desde otra rama."
            }
        }
    }
}

Write-Host "Hecho. Revisa el estado con 'git log --oneline' y 'git remote -v'."
Pop-Location
