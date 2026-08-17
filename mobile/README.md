# Etik para Android

Este directorio contiene el target Android de Etik basado en Capacitor. La versión web continúa viviendo en la raíz del repositorio y GitHub Pages sigue usando su workflow independiente.

## Objetivo

Compartir la misma base de HTML, CSS y JavaScript entre Etik Web y Etik Android para evitar mantener dos editores distintos.

## Preparar el proyecto

Desde `mobile/`:

```bash
npm install
npm run android:init
npm run android:open
```

`android:init` hace dos cosas:

1. Reconstruye en `mobile/www/` los mismos recursos que usa GitHub Pages (`styles.css`, `app.js`, motor QR y scripts de Etik).
2. Genera el proyecto nativo Android con Capacitor.

Después de modificar la versión web:

```bash
npm run android:sync
```

Esto reconstruye el bundle web y lo sincroniza con Android.

## APK de prueba desde GitHub

El repositorio incluye un workflow manual **Build Etik Android APK**. Desde la pestaña Actions se puede ejecutar y descargar un APK `debug` como artifact, sin afectar el despliegue web.

## Estado

Android se considera actualmente `1.0.0-alpha.1`. El editor, plantillas `.etik`, QR, historial y biblioteca comparten código con la versión web. Las siguientes etapas serán integrar mejor el botón Atrás de Android, compartir archivos mediante APIs nativas, impresión y recursos de launcher/splash propios.
