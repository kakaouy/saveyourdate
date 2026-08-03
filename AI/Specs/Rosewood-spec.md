# SPEC — Modelo Rosewood

## 1. Identificación

**Nombre interno:** Rosewood
**Categoría:** Invitación digital para fiesta de 15 años
**Estado:** Implementado
**Versión:** 1.0
**Referencia:** `temp-vite-app/public/rosewood/index.html`

Rosewood es un modelo romántico, botánico y sobrio. Combina fotografía protagonista, ornamentos florales asimétricos, textura de papel, tonos salvia/rosa o petróleo/champagne y una composición tipográfica delicada.

La implementación productiva debe reconstruir la referencia como componente React reutilizable. No debe utilizar el HTML como `iframe` ni conservar nombres, fechas o enlaces de demostración.

---

## 2. Fuentes de verdad

1. `AI/Design System/Design_System.md`
2. `AI/Specs/Rosewood-spec.md`
3. `temp-vite-app/public/rosewood/index.html`
4. `temp-vite-app/public/rosewood/images/`
5. `temp-vite-app/public/rosewood/font/`
6. Componentes productivos Verona, Varezzia y Rivendell.

---

## 3. Concepto y experiencia

Rosewood debe sentirse cálido, artesanal y refinado. La floración acompaña el recorrido como marco orgánico; la experiencia conserva aire y legibilidad, evitando que los ornamentos cubran textos o controles.

### Aprobado

- Hero fotográfico con ornamentos botánicos en extremos opuestos.
- Jerarquía de portada: fecha numérica, nombre y “Mis 15 Años”.
- Alternancia de fondos claros y acento.
- Idiomas español, portugués e inglés.
- Tres paletas: `petroleo-champagne`, `rosa-salvia` y `verde-dorado`.
- Footer corporativo compartido.
- Selector de idioma y paleta únicamente en la experiencia general del catálogo.

### No modificar

- El carácter botánico y asimétrico.
- La fotografía principal como fondo dominante del hero.
- La escala protagonista del nombre.
- La textura de papel y el uso moderado de dorados.
- El orden de secciones sin validación de diseño.

---

## 4. Sistema visual

### 4.1 Tipografías

- **Nombre, títulos y firma:** `Scaver-Thin`.
- **Cuerpo, botones y formularios:** `Scaver-Medium`.
- Carga local desde `/rosewood/font/`.
- Se preserva el contraste entre trazos finos editoriales y texto funcional de mayor peso.
- Escala responsive mediante `clamp()`; nombres largos deben envolver sin colisionar con ornamentos.

### 4.2 Paletas

Mismo contrato semántico de tokens que Aurora:

```css
--color-fondo
--color-fondo-alterno
--color-titulos
--color-secundario
--color-acento
--color-acento-oscuro
--color-texto
--color-botones
--color-bordes
--color-ornamentos
--color-texto-claro
--color-foco
```

| Preset | Fondo | Títulos | Acento | Botón | Ornamentos |
|---|---|---|---|---|---|
| `petroleo-champagne` (default) | `#faf8f2` | `#32666a` | `#c3a46d` | `#a88850` | `#b99b61` |
| `rosa-salvia` | `#fbf7f3` | `#8f6269` | `#bd8b91` | `#a8757d` | `#879b83` |
| `verde-dorado` | `#f7f7f1` | `#2f5d50` | `#b9964a` | `#b08a3c` | `#c6a85b` |

Los tres presets deben mantener contraste WCAG AA y recolorear todos los componentes mediante tokens.

### 4.3 Fotografía, fondo y ornamentos

- Hero: `/rosewood/images/foto-01.png`, carga prioritaria.
- Parallax: imagen configurable; referencia disponible `foto-05.jpg`.
- Galería: `foto-01.jpg` a `foto-05.jpg` cuando se active.
- Fondo: `fondo_papel.png`.
- Ornamentos: `flores-der-top.png`, `flor-izq-bottom.png`, `lado-izquierdo.png`, `separador_izquierda.png`, `separador_derecha.png`.
- Indicador: `navegar.png`.
- Todos los recursos decorativos deben ser inaccesibles para lectores de pantalla y no afectar el flujo ni el ancho del documento.
- Puntos focales y overlays configurables por breakpoint.

---

## 5. Arquitectura de secciones

Orden aprobado:

1. Loader.
2. Hero.
3. Cuenta regresiva.
4. Cuándo y dónde.
5. Frase destacada.
6. Código de vestimenta.
7. Cronograma.
8. Fotografía parallax.
9. Galería opcional.
10. Alojamiento.
11. Mesa de regalos.
12. Compartir fotografías.
13. Instagram y redes.
14. Sugerencias musicales.
15. Pase QR.
16. Confirmación de asistencia.
17. Footer corporativo.
18. Modales.

Cada sección, salvo el footer, es configurable. Los ornamentos asociados se ocultan o reubican cuando una sección no se renderiza. Los tonos se declaran explícitamente por sección.

### Estado inicial de referencia

- Activas: hero, ubicación, frase, dress code, cronograma, parallax, alojamiento, regalos, carga de fotos, social, sugerencias musicales, QR y RSVP.
- Countdown: presente en arquitectura, desactivado por defecto en el HTML actual.
- Galería: presente en arquitectura, desactivada por defecto.

---

## 6. Responsive

### Mobile first

- Soporte desde 320 px sin overflow horizontal.
- Hero de `100svh` con fotografía `cover` y punto focal configurable.
- Ornamentos reducidos y recortados de forma intencional en móvil.
- Nombre, fecha y título legibles sobre fotografía en todos los presets.
- Countdown, cuando se active, cabe completo en 320 px.
- Botones apilados y con altura objetivo de 48 px.
- Modales usan unidades dinámicas, safe areas, scroll interno y teclado móvil.
- Parallax desactivado en touch y movimiento reducido.

### Tablet y desktop

- Contenido centrado con ancho de lectura máximo de 760 px.
- Hero limitado para evitar escalado excesivo.
- Ornamentos laterales pueden crecer mediante `clamp()` sin invadir contenido.
- Galería mantiene relaciones de aspecto y una grilla equilibrada.
- Breakpoints orientativos: 560 px, 768 px y 1100 px.

---

## 7. Animaciones

| Elemento | Animación | Activación | Duración | Repetición |
|---|---|---|---|---|
| Loader | fade de salida + spinner | carga inicial, con timeout | 500–700 ms | una vez |
| Fecha, nombre y título del hero | fade-up escalonado | fin del loader | 700–900 ms | una vez |
| Flores del hero | fade + scale suave | fin del loader | 900–1100 ms | una vez |
| Partículas decorativas | float mínimo | hero visible | 6–9 s | continua, sutil |
| Indicador de scroll | desplazamiento leve | hero visible | 1.8–2.4 s | continua |
| Títulos, textos, iconos y botones | fade-up | entrada al viewport | 600–800 ms | una vez |
| Imágenes | blur/zoom reveal suave | entrada al viewport | 800–1000 ms | una vez |
| Ornamentos laterales | fade lateral + float | entrada al viewport | 800 ms / 6–8 s | reveal una vez; float continua |
| Modales | fade + scale 0.98 → 1 | apertura | 200–280 ms | por apertura |

Con `prefers-reduced-motion: reduce`, todo el contenido queda visible, sin parallax, desplazamientos, partículas animadas ni flotación.

---

## 8. Parametrización

- `locale`: `es | pt | en`.
- `palettePreset`: cualquiera de los tres presets.
- Evento: nombre, tipo, inicio, fin, zona horaria, lugar, dirección, calendario y fecha límite RSVP.
- Frase, hashtag, dress code y textos opcionales.
- Links: mapa, redes, carga de fotos, regalos y servicios.
- Cronograma, hoteles y galería como colecciones.
- Regalos con datos bancarios y/o enlace.
- Pase QR por invitado/grupo.
- Imágenes, alt, puntos focales y overlay.
- Tipografías mediante tokens del modelo.
- Visibilidad y tono por sección.
- Metadata y privacidad.

La implementación tendrá tipos y `DEFAULT_CONFIG` propios. Debe eliminarse la dependencia heredada de `window.VERONA_SITE_CONFIG`.

---

## 9. Funcionalidad y accesibilidad

- Fechas localizadas con `Intl.DateTimeFormat` y coherencia entre fecha visual, countdown y calendario.
- Countdown sin valores negativos y mensaje final configurable.
- RSVP integrado al backend existente con todos sus estados.
- Sugerencia musical integrada al flujo de datos si se mantiene aprobada.
- Galería con lazy loading, dimensiones reservadas, alt parametrizado y lightbox accesible.
- Modales con focus trap, Escape, backdrop, foco inicial y restauración.
- Links externos seguros; estado visible cuando falte configuración.
- Skip link, landmarks, labels, `aria-live`, foco visible y contraste AA.
- Footer corporativo obligatorio, responsive y adaptado a cada preset.
- Loader nunca bloquea el acceso indefinidamente.

---

## 10. Criterios de aceptación

- Rosewood se integra como componente React productivo y no como `iframe`.
- Mantiene tipografía, fotografía, ornamentos, textura y disposición del HTML en 320, 375, 768, 1024 y 1440 px.
- Los tres idiomas actualizan textos, fechas, accesibilidad, metadatos, formularios y modales.
- Las tres paletas recolorean toda la invitación sin estilos rígidos residuales.
- Activar/desactivar countdown, galería u otra sección conserva una composición coherente.
- No existe overflow horizontal, errores de consola ni assets faltantes.
- Reduced motion funciona y no oculta contenido.
- Footer corporativo siempre presente.
- Build, lint y pruebas existentes pasan.
- Revisión visual comparativa aprobada contra el HTML fuente.

---

## 11. Pendiente de validación

- Confirmar el nombre comercial **Rosewood**.
- Confirmar `petroleo-champagne` como paleta predeterminada.
- Confirmar countdown y galería desactivados por defecto.
- Confirmar que la sugerencia musical forma parte del modelo.
- Confirmar que no incluye música de ambientación ni pantalla previa de ingreso.
- Confirmar la fecha visual numérica `DD · MM · AAAA` como rasgo fijo del modelo.

## Implementado

- Componente React productivo y configuración propia.
- Integración al catálogo, selector de idioma y tres paletas.
- Responsive, animaciones, reduced motion, QR, RSVP y footer corporativo.

## Validación pendiente

- Revisión visual final en dispositivos físicos.
