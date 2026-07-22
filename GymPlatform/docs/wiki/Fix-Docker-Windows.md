# Reparar Docker Desktop en Windows 11 (GymPlatform)

> Diagnóstico en esta PC (2026-07-20):
> - Build **26200.8875** (KB5121767 → 8894 aún **no aplicado**)
> - Docker 4.81.0 se **corta** en `EnableFeaturesAction` (VirtualMachinePlatform + WSL)
> - Instalación **interrumpida**: `C:\ProgramData\DockerDesktop\update-state.json` en fase Components
> - Falta `install-settings.json` (causa típica de crash al reintentar)
> - Paquetes CBS de VirtualMachinePlatform en estado **Staged** (Windows a medias)
> - WSL **2.7.10.0** (actualizar a la última disponible)

Ejecutar **como Administrador** (clic derecho → Ejecutar como administrador).

---

## Paso 0 — Reinicio limpio (importante)

1. Cierra Cursor, navegadores y cualquier instalador de Docker.
2. **Configuración → Windows Update**
3. Instala **todo** lo pendiente (incluido KB5121767 si aparece).
4. **Reinicia** aunque no lo pida (después de updates suele ser obligatorio).

---

## Paso 1 — Reparar imagen de Windows (DISM + SFC)

Abre **PowerShell como Administrador** y pega:

```powershell
DISM /Online /Cleanup-Image /RestoreHealth
sfc /scannow
```

Si DISM reporta errores, reinicia y repite una vez.

---

## Paso 2 — Habilitar componentes que Docker necesita

En la **misma** ventana de PowerShell (Admin):

```powershell
dism /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
dism /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism /online /enable-feature /featurename:HypervisorPlatform /all /norestart
```

Comprueba estado:

```powershell
Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform | Select FeatureName,State
Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux | Select FeatureName,State
```

Ambos deben decir **Enabled**. Si alguno queda **Disabled** o falla con `0x800f0819`, vuelve al Paso 0 (update + reinicio) antes de seguir.

**Reinicia el PC.**

---

## Paso 3 — Actualizar WSL

PowerShell (Admin), después del reinicio:

```powershell
wsl --update
wsl --set-default-version 2
wsl --status
wsl --version
```

Objetivo: versión WSL **≥ 2.9.3** si Windows Update lo ofrece (2.7.10.0 da problemas en builds recientes).

Opcional pero recomendado (Docker lo usa internamente):

```powershell
wsl --install --no-distribution
```

---

## Paso 4 — Limpiar instalación rota de Docker

PowerShell (Admin):

```powershell
# Detener procesos Docker
Get-Process *docker* -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Desinstalar si aparece en Apps (ignora error si no está)
Get-Package *Docker* -ErrorAction SilentlyContinue | Uninstall-Package -Force -ErrorAction SilentlyContinue

# Borrar restos (instalación interrumpida)
Remove-Item -Recurse -Force "C:\ProgramData\DockerDesktop" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "C:\Program Files\Docker" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Docker" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:APPDATA\Docker" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Docker Desktop Installer" -ErrorAction SilentlyContinue

# Limpiar distros Docker rotas en WSL (NO borra docker-desktop-data con datos; aquí no hay instalación completa)
wsl --unregister docker-desktop 2>$null
wsl --unregister docker-desktop-data 2>$null

Write-Host "Limpieza completada."
```

---

## Paso 5 — Instalar Docker Desktop (instalador oficial)

1. Descarga el instalador **.exe** desde https://www.docker.com/products/docker-desktop/ (evita Microsoft Store si falló antes).
2. Clic derecho en el `.exe` → **Ejecutar como administrador**.
3. Marca **Use WSL 2 instead of Hyper-V** si aparece.
4. Deja que termine **sin cancelar** (puede tardar varios minutos en EnableFeatures).

Si vuelve a fallar, abre el log y busca la última línea:

```
notepad C:\ProgramData\DockerDesktop\install-log-admin.txt
```

---

## Paso 6 — Verificar

```powershell
docker version
docker compose version
wsl -l -v
```

Debe aparecer `docker-desktop` en la lista WSL.

Luego, desde GymPlatform:

```bash
cd GymPlatform
docker compose up -d
docker compose ps
```

---

## Si sigue fallando

Copia las **últimas 30 líneas** de:

- `C:\ProgramData\DockerDesktop\install-log-admin.txt`
- Salida de: `Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform`
- Salida de: `wsl --status`

Y pégalo en Cursor para revisar el error exacto.

### Errores conocidos en build 26200

| Error | Causa | Acción |
|-------|-------|--------|
| `NullReferenceException` en `UpdateInstallSettings` | `C:\ProgramData\DockerDesktop` corrupto | Paso 4 completo |
| Se queda en `EnableFeaturesAction` | Windows Update / CBS a medias | Pasos 0–2 + reinicio |
| `0x800f0819` WindowsMediaPlayer | Update de Windows incompleto | Paso 0, reiniciar, DISM |
| `ERROR_FILE_NOT_FOUND` en WSL | WSL 2.7.10.0 roto | `wsl --update` (Paso 3) |

---

## Sobre KB5121767

Ese update (**26200.8894**) es un parche de Microsoft por problemas en algunos equipos Dell/Intel tras el preview de junio. En tu Lenovo puede aparecer igual si tienes activado “Obtener las actualizaciones más recientes tan pronto como estén disponibles”.

**No es que Docker “no soporte” ese KB** — el problema típico es instalar Docker **mientras Windows tiene componentes staged o un reinicio pendiente**. Orden correcto:

1. Aplicar KB5121767 (y demás updates)
2. Reiniciar
3. DISM + habilitar features
4. Limpiar Docker roto
5. Instalar Docker de nuevo
