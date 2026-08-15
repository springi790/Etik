# Etik

Etik es un diseñador visual de etiquetas pensado para escritorio y móvil. Permite crear etiquetas personalizadas y prepararlas para impresión con medidas reales.

## Funciones

- Texto editable con alineación, tamaño, estilo y fuentes personalizadas.
- Importación local de imágenes.
- Códigos QR generados localmente, sin CDN.
- Códigos de barras Code 128.
- Movimiento, redimensionado, rotación, capas y centrado de elementos.
- Tamaño de etiqueta configurable en milímetros.
- Cuadrícula, ajuste automático y margen seguro.
- Interfaz móvil con paneles inferiores y controles táctiles.
- Guardado local e importación/exportación de diseños JSON.
- Impresión directa desde el navegador.

## Uso local

Puedes servir el repositorio con cualquier servidor HTTP estático. Por ejemplo:

```bash
python -m http.server 8000
```

Después abre `http://localhost:8000`.

## GitHub Pages

El repositorio incluye un workflow para desplegar automáticamente la rama `main` en GitHub Pages.
