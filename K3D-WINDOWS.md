# k3d Installation auf Windows

## Voraussetzungen

### 1. Docker Desktop installieren

k3d startet Kubernetes in Docker-Containern — Docker muss daher zuerst installiert und gestartet sein.

1. Docker Desktop herunterladen: https://www.docker.com/products/docker-desktop
2. Installer ausführen
3. PC neu starten, wenn dazu aufgefordert wird
4. Docker Desktop öffnen und warten bis "Docker is running" angezeigt wird

### 2. WSL 2 aktivieren (falls noch nicht geschehen)

Docker Desktop benötigt WSL 2 (Windows Subsystem for Linux) als Backend.

**PowerShell als Administrator** öffnen:

```powershell
wsl --install
```

PC neu starten, falls dazu aufgefordert wird.

---

## k3d installieren

**PowerShell** öffnen und ausführen:

```powershell
winget install k3d
```

Alternative über Chocolatey:

```powershell
choco install k3d
```

### Überprüfen

```powershell
k3d version
```

> **Erwartete Ausgabe:** `k3d version v5.x.x` und `k3s version v1.x.x`

---

## kubectl installieren

```powershell
winget install Kubernetes.kubectl
```

Alternative über Chocolatey:

```powershell
choco install kubernetes-cli
```

### Überprüfen

```powershell
kubectl version --client
```

> **Erwartete Ausgabe:** `Client Version: v1.x.x`

---

## Alles testen

```powershell
# Docker muss laufen
docker version

# Test-Cluster erstellen
k3d cluster create test

# Prüfen ob der Cluster läuft
kubectl get nodes

# Test-Cluster wieder löschen
k3d cluster delete test
```

> **Erwartete Ausgabe:** Ein Node mit Status `Ready`. Wenn das funktioniert, kannst du mit den Schritten in `K3D.md` weitermachen.
