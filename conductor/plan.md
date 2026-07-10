# Plan de Implementación: Save Your Date (Prototipo Frontend)

## 1. Objetivo y Alcance
Crear un prototipo funcional y estéticamente atractivo para la plataforma de invitaciones "Save Your Date", inspirado en la navegación y estructura de Fixdate. La aplicación será una *Landing Page* tipo "One-Page" orientada a la conversión, donde el usuario podrá ver modelos de invitaciones y realizar pedidos.

## 2. Stack Tecnológico
*   **Framework Frontend:** React (con TypeScript) inicializado vía Vite. Esta es la opción más sencilla de mantener, con recarga rápida y sin la complejidad de renderizado en servidor de Next.js.
*   **Estilos:** Vanilla CSS (CSS Modules o archivos globales) para garantizar la máxima flexibilidad y cumplimiento estricto del diseño visual solicitado, sin depender de utilitarios como Tailwind.
*   **Iconos:** React Icons (opcional) o SVGs integrados.
*   **Datos:** Archivos JSON estáticos (Mocks) para la galería y modelos de invitaciones.

## 3. Guía de Diseño y Estilos
*   **Paleta de Colores:**
    *   **Fondo principal:** Blanco (`#FFFFFF`).
    *   **Color Primario:** Rosado suave/pastel (ej. `#F4A6B6`) para destacar delicadeza.
    *   **Color Secundario / Acento:** Rojo (ej. `#D32F2F` o `#E0004D`) para destacar botones de conversión o detalles clave.
    *   **Color de Detalles:** Verde Agua / Mint (ej. `#73C6B6` o `#A3E4D7`) para iconos, hovers, o etiquetas (tags) en los modelos.
*   **Tipografía:**
    *   **Títulos y Encabezados:** `Garamond` (fuente serif clásica y elegante).
    *   **Cuerpo de Texto y UI:** `Nunito` (o similar, fuente sans-serif redonda, moderna y amigable).
*   **Animaciones:**
    *   **Tipo "Latido" (Pulse / Heartbeat):** Aplicado sutilmente al botón principal "Crea tu invite" y en el acceso a "Ver modelos" para llamar la atención sin saturar.
    *   **Scroll:** Comportamiento `smooth` (suave) al navegar entre las secciones desde el menú.

## 4. Estructura de la Aplicación (Componentes)

La aplicación constará de los siguientes bloques renderizados verticalmente:

1.  **Layout y Navegación (Header/Sidebar):**
    *   Un menú lateral derecho o un menú hamburguesa que se despliega desde la derecha.
    *   **Enlaces de navegación (anclas):** Inicio, Modelos, ¿Qué incluyen?, Hace tu pedido, Contacto.
2.  **Sección 1: Inicio (Hero):**
    *   Mensaje de bienvenida y propuesta de valor ("Save Your Date").
    *   Botones de Acción (CTAs): "Crea tu invite" (con animación de latido) y "Ver modelos".
3.  **Sección 2: Modelos (Galería):**
    *   Filtros tipo pestañas o botones para categorías: **Bodas, 15 años, Otros Eventos**.
    *   Cuadrícula (Grid) de tarjetas mostrando los diseños, alimentada por datos de prueba (Mocks).
4.  **Sección 3: ¿Qué incluyen?:**
    *   Listado visual con iconos (verde agua) de las características (ej. cuenta regresiva, confirmación de asistencia, música, etc.).
5.  **Sección 4: Hace tu pedido (Proceso):**
    *   Breve explicación de los pasos para contratar/crear la invitación y un CTA destacado en rojo/rosado.
6.  **Sección 5: Contacto & Footer:**
    *   Formulario simple de contacto y/o botón directo a WhatsApp.
    *   Enlaces a redes sociales.

## 5. Fases de Implementación

*   **Fase 1: Configuración Base.** Inicialización del proyecto Vite + React + TS. Configuración de variables CSS (colores y fuentes desde Google Fonts).
*   **Fase 2: Layout y Navegación.** Construcción del menú lateral derecho y la estructura One-Page con anclas (`#inicio`, `#modelos`, etc.).
*   **Fase 3: Secciones Principales.** Desarrollo del Hero, Sección de características y flujo de pedido.
*   **Fase 4: Galería de Modelos.** Creación del mock de datos (JSON) para las tarjetas de Bodas/15 años/Otros eventos y la cuadrícula interactiva.
*   **Fase 5: Estilización Final y Animaciones.** Ajuste de paleta de colores, aplicación de la animación de "latido" y detalles en verde agua.

## 6. Verificación y Testing
*   El sitio será responsivo (adaptable a móviles, tablets y escritorio).
*   Se verificará que los enlaces del menú realicen un scroll fluido hasta la sección correspondiente.
*   Validación visual de la paleta de colores y combinación tipográfica (Garamond + Nunito).