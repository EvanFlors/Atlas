# ATLAS — Portal de aprendizaje

Sitio web estático con los 66 módulos del programa: Excel (24), Google Sheets (12), VBA (15) y Apps Script (15).

## Inicio rápido

1. Descomprime `Portal_Aprendizaje_66_Modulos.zip`.
2. Abre `index.html` en Chrome, Edge, Firefox o Safari. El catálogo de lecciones está incorporado dentro del HTML, por lo que no necesita servidor ni base de datos.
3. Navega por el menú lateral, abre módulos, marca secciones como estudiadas y guarda favoritos.
4. Para transferir el progreso entre dispositivos usa **Exportar progreso** y **Importar progreso**.

## Persistencia y límites

- El progreso se guarda en `localStorage` del navegador, por origen. No hay sincronización en nube ni cuentas de usuario.
- Al usar el archivo directamente (`file://`), algunos navegadores pueden limitar el almacenamiento local. Para uso estable, se recomienda servir la carpeta mediante `python3 -m http.server 8000` y abrir `http://localhost:8000`.
- Los textos y códigos son accesibles sin conexión. Para la visualización enriquecida de Markdown y diagramas Mermaid se usan bibliotecas cargadas desde CDN, que requieren internet. Sin conexión, el sitio utiliza un renderizador de Markdown básico y muestra el código Mermaid como texto.
- Las imágenes referenciadas mediante enlaces remotos necesitan conexión. No se han generado imágenes que no estén en el material original.
- La protección y copia de seguridad del progreso dependen del navegador; se recomienda exportarlo periódicamente.
- Para publicarlo en la web, sube la carpeta a un alojamiento estático (GitHub Pages, Cloudflare Pages, Netlify, etc.). No incluye backend ni autenticación.

## Estructura

- `index.html`: sitio autónomo con todo el catálogo integrado.
- `catalogo.json`: contenido estructurado con temas y secciones.
- `contenidos/`: documentos Markdown originales por ruta.

## Seguridad

Los materiales son datos de lectura. No ingreses contraseñas ni claves en los ejercicios de código. El progreso se almacena solo localmente.
