# Windows atascado: KB5121767 + Reset PC roto

> PC: Lenovo, Windows 11 **25H2** build **26200.8875**  
> Síntoma: KB5121767 clavado en "Downloading 6%" y "Restablecer este PC" no funciona.

---

## Lo más importante (léelo primero)

### 1. KB5121767 **no es obligatorio** en tu Lenovo

Microsoft dice que ese update es **solo para Dell afectados** por un driver Intel. En equipos no afectados: **no hace falta instalarlo**.

Si tienes activado **"Obtener las actualizaciones más recientes tan pronto como estén disponibles"**, Windows lo descarga igual y puede quedarse clavado.

**Acción:** Configuración → Windows Update → **desactiva** ese interruptor.

### 2. El reset roto **no es culpa tuya**

Microsoft confirmó bugs donde **"Restablecer este PC" falla** tras updates recientes (entorno de recuperación WinRE dañado). Por eso no te deja resetear desde Configuración.

**Solución real para formatear/resetear:** USB booteable o reparación in-place (abajo), no el botón normal de Reset.

---

## Parte A — Desatascar Windows Update (KB5121767)

Ejecuta **PowerShell como Administrador** (clic derecho → Ejecutar como administrador).

### A1. Parar servicios y limpiar descarga corrupta

```powershell
Stop-Service wuauserv,bits,DoSvc -Force -ErrorAction SilentlyContinue

Rename-Item C:\Windows\SoftwareDistribution\Download C:\Windows\SoftwareDistribution\Download.old -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path C:\Windows\SoftwareDistribution\Download -Force | Out-Null

Start-Service bits,cryptsvc
Start-Service wuauserv
```

### A2. Reparar componentes de Windows

```powershell
DISM /Online /Cleanup-Image /RestoreHealth
sfc /scannow
```

Reinicia.

### A3. Buscar updates de nuevo (con el toggle OFF)

1. Configuración → Windows Update → **desactivar** "Obtener las actualizaciones más recientes…"
2. Buscar actualizaciones
3. Si KB5121767 vuelve a aparecer clavado → **no lo necesitas**; puedes ocultarlo:

```powershell
# Ocultar KB5121767 (opcional, si sigue insistiendo)
# Descarga wushowhide.diagcab desde Microsoft "Show or hide updates" si hace falta
```

O instalar manualmente solo si realmente lo quieres: [Microsoft Update Catalog — buscar KB5121767](https://www.catalog.update.microsoft.com/Search.aspx?q=KB5121767) → elegir **Windows 11 Version 25H2 x64** → descargar `.msu` → doble clic → reiniciar.

---

## Parte B — Resetear / formatear cuando Configuración falla

El botón **Configuración → Sistema → Recuperación → Restablecer este PC** puede fallar por bug de Microsoft. Usa una de estas:

### Opción 1 — Reparar Windows sin borrar archivos (recomendada primero)

Configuración → **Sistema → Recuperación** →  
**"Solucionar problemas mediante Windows Update"** / **"Fix problems using Windows Update"**  
(reinstala Windows manteniendo apps y archivos)

Si esa opción existe y funciona, arregla WinRE y a veces desbloquea updates.

### Opción 2 — Actualización in-place (mismo Windows, archivos intactos)

1. En otro PC o cuando el update no esté clavado, descarga **Media Creation Tool**:  
   https://www.microsoft.com/software-download/windows11
2. Crear ISO o USB
3. En tu PC: montar ISO → ejecutar **`setup.exe`**
4. Elegir **Conservar archivos personales y aplicaciones**

Reemplaza archivos del sistema sin usar "Reset this PC".

### Opción 3 — Formateo limpio (USB booteable)

1. Media Creation Tool → **crear USB booteable** (8 GB+)
2. Reiniciar → Boot desde USB (F12 en Lenovo)
3. Instalación limpia → borra particiones si quieres formateo total
4. **Respaldar** `Documents`, proyecto GymPlatform, etc. antes

Esta opción **sí formatea** aunque Reset esté roto.

---

## Parte C — Después de arreglar Windows → Docker

Solo cuando Windows Update esté estable (o hayas hecho in-place / limpieza):

Seguir: [Fix-Docker-Windows.md](Fix-Docker-Windows.md)

Orden: Windows estable → DISM → WSL features → limpiar `C:\ProgramData\DockerDesktop` → instalar Docker.

---

## Orden sugerido para tu caso

1. **Desactivar** toggle de updates anticipados  
2. **A1 + A2** (limpiar cache + DISM) → **reiniciar**  
3. Comprobar si Windows Update ya no se queda en 6%  
4. Si Reset sigue roto → **Opción 1** o **Opción 2**  
5. Si quieres formateo total → **Opción 3** (USB)  
6. Luego Docker según Fix-Docker-Windows.md  

---

## Si nada avanza

Anota el **mensaje exacto** al resetear y si aparece código (0x800…). Con eso se puede acotar el siguiente paso.
