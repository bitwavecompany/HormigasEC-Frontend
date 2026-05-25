# HormigasEC

Plataforma web para el registro, visualización y gestión de especies de hormigas en Ecuador. Permite explorar la distribución geográfica por provincia sobre un mapa interactivo, gestionar archivos de datos en formato Excel y administrar usuarios con roles diferenciados.

---

## Stack

- **React 19** + **TypeScript 6** — UI y lógica de cliente
- **Vite 8** — bundler y servidor de desarrollo
- **Tailwind CSS 3** — estilos utilitarios
- **MapLibre GL** + **react-map-gl** — mapa interactivo vectorial
- **deck.gl** — capas de visualización geoespacial
- **Motion** (`motion/react`) — animaciones
- **React Router DOM 7** — enrutamiento SPA
- **Sonner** — notificaciones toast
- **jwt-decode** — decodificación de JWT en cliente

---

## Requisitos previos

- **Node.js** ≥ 18
- **npm** ≥ 9
- Backend de la API corriendo (por defecto en `http://localhost:8000`)

---

## Instalación y puesta en marcha

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd hormigas-ecuador

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env y ajustar VITE_API_URL si el backend no corre en localhost:8000

# 4. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:8000
```

| Variable        | Descripción                          | Valor por defecto          |
|-----------------|--------------------------------------|----------------------------|
| `VITE_API_URL`  | URL base de la API REST del backend  | `http://localhost:8000`    |

---

## Scripts disponibles

| Comando           | Descripción                                      |
|-------------------|--------------------------------------------------|
| `npm run dev`     | Inicia el servidor de desarrollo con HMR         |
| `npm run build`   | Compila TypeScript y genera el bundle de producción en `dist/` |
| `npm run preview` | Sirve el build de producción localmente          |
| `npm run lint`    | Ejecuta ESLint sobre todos los archivos `.ts/.tsx` |

---

## Archivos estáticos requeridos

El mapa depende de tres archivos GeoJSON que deben estar en `public/data/`:

```
public/
└── data/
    ├── hormigas.json       # Datos de especies { "hormigas": [...] }
    ├── provincias.json     # GeoJSON con polígonos de provincias del Ecuador
    └── centroides.json     # GeoJSON con centroides para etiquetas del mapa
```

Sin estos archivos el módulo de mapa no cargará correctamente.

---

## Estructura del proyecto

```
src/
├── api/              # Clientes HTTP (auth, users, excels)
├── components/       # Componentes reutilizables y canvas animados
├── context/          # AuthContext
├── hooks/            # useAuth
├── layouts/          # AppLayout (sidebar + nav móvil)
├── lib/              # Variantes de animación (motion)
├── modules/
│   ├── mapa/         # Visualización geoespacial por provincia
│   ├── usuarios/     # CRUD de usuarios (solo admin)
│   └── archivos/     # Gestión de archivos Excel
├── providers/        # AuthProvider (JWT, localStorage)
├── styles/           # tokens.css, components.css
└── types/            # Interfaz Hormiga
```

---

## Autenticación y roles

La autenticación usa JWT almacenado en `localStorage` bajo la clave `hormigas_token`. El token se decodifica en cliente para extraer email y rol. Las rutas bajo `/app` están protegidas por `ProtectedRoute`.

| Rol           | Mapa | Archivos                  | Usuarios |
|---------------|------|---------------------------|----------|
| `admin`       | ✓    | Subir / editar / eliminar | ✓ CRUD   |
| `researcher`  | ✓    | Subir / editar / eliminar | ✗        |
| `viewer`      | ✓    | Solo descarga             | ✗        |

> **Nota:** Los nuevos usuarios creados via `POST /auth/register` reciben el rol `viewer` por defecto. El rol solo puede modificarse desde el módulo de usuarios por un administrador.

---

## Build para producción

```bash
npm run build
```

El output queda en `dist/`. Servir como sitio estático apuntando siempre a `index.html` para que el enrutamiento del lado cliente funcione correctamente (SPA fallback).

Ejemplo con Nginx:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## Notas adicionales

- **Fuentes externas:** la aplicación carga `Nunito` y `DM Sans` desde Google Fonts. En entornos sin acceso a internet se deben alojar localmente y actualizar `src/index.css`.

- **Mapa sin API key:** el mapa usa un estilo vectorial propio (fondo + GeoJSON local) sin depender de servicios de tiles externos. Los glifos se cargan desde `demotiles.maplibre.org`; sustituir esa URL si se requiere un entorno completamente offline.

- **Canvas animados:** `LoginFieldCanvas` y `SidebarFieldCanvas` renderizan hormigas animadas con `requestAnimationFrame` puro sobre `<canvas>`. Son decorativos (`aria-hidden="true"`) y no afectan el rendimiento de la lógica de negocio.

- **Backend pendiente:** `PATCH /users/{id}` y `DELETE /users/{id}` están definidos en el frontend pero marcados como TODO en el backend. Funcionarán en cuanto el backend los implemente.

- **Responsive:** en pantallas `< 768px` el sidebar se reemplaza por una barra de navegación inferior fija. El panel de detalle del mapa aparece como un sheet deslizable desde la parte inferior.