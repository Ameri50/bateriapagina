# bateriapagina

Página web de **BatteryLink** hecha con React: muestra la batería real del dispositivo, sus especificaciones y un historial personal por equipo, usando el inicio de sesión con Google y Firestore del proyecto de tesis **`miapp-4a216`**.

La pantalla replica el tablero de la app nativa BatteryLink (anillo de nivel, estado de carga, autonomía, tendencia e historial), pero en el navegador y con datos reales de la Battery Status API.

## Qué incluye

- **Batería en vivo**: nivel, estado de carga, tiempo para completar y autonomía estimada desde `navigator.getBattery()`. Si el navegador no expone la batería, se muestra un aviso y no se inventan datos.
- **Historial real por equipo**: una muestra por minuto mientras la página está abierta (máximo 720). Se guarda en `localStorage` y, con sesión, se sincroniza en tu cuenta.
- **Google del proyecto de tesis**: inicio de sesión con Google (popup en escritorio, redirect en móvil) y almacenamiento en `users/{uid}` de Firestore. Sin sesión todo se queda en el navegador.
- **Personalización**: saludo con tu nombre y foto de Google, nombre editable del equipo, color de acento y hasta 6 temas; cada navegador recuerda sus preferencias.
- **Varios equipos**: el documento del usuario guarda el historial y la ficha de cada dispositivo que entra con la cuenta. El historial se puede filtrar por equipo.
- **Vistas**:
  - **Inicio**: anillo de batería, especificaciones del navegador, lista de baterías y tendencia de 7 días.
  - **Historial**: estadísticas de la semana, gráfica de 24 h o 7 días, resumen por día y últimas lecturas.
  - **Ajustes**: cuenta, nombre del equipo, color, exportar JSON y borrar historial con confirmación.
- **Datos honestos**: salud, ciclos y temperatura aparecen como no disponibles porque la web no puede leerlos; solo la app nativa BatteryLink consulta el controlador real.

## Cómo ejecutarlo

```bash
npm install
npm run dev
```

Abre la URL que imprime Vite (por defecto `http://localhost:5173`).

Compilar para producción:

```bash
npm run build
npm run preview
```

El resultado queda en `dist/`. La configuración usa `base: "./"`, así que funciona también en GitHub Pages o en cualquier subcarpeta.

## Firebase

La página usa el mismo proyecto que la app iOS y el panel web de tesis:

| Campo | Valor |
| --- | --- |
| Proyecto | `miapp-4a216` |
| Auth | Google habilitado |
| Firestore | `users/{uid}` |

No hace falta crear un proyecto nuevo. En **Firebase Console → Authentication → Settings → Authorized domains** deben estar el dominio donde se publique la página y `localhost` para desarrollo.

Firestore guarda todo dentro del documento del usuario, para que las reglas existentes (propietario de `/users/{userId}`) sigan siendo válidas sin desplegar cambios:

```txt
users/{uid}
  displayName, email, ...        // datos que ya usa la app
  battery:
    updatedAt: timestamp
    history: [
      { t: 1763681200000, level: 99, charging: false, deviceId: "..." }
    ]
    devices:
      "<deviceId>": { alias, model, platform, browser, cores, memoryGB, screen, level, charging, updatedAt }
```

El historial se escribe con `setDoc(..., { merge: true })`, se fusiona al iniciar sesión y se conserva en `localStorage` como respaldo. La sincronización ocurre cada 90 segundos, al ocultar la pestaña, al cambiar el nombre del equipo y con el botón **Sincronizar ahora**.

> Esta versión no modifica ni despliega reglas de Firestore. Solo lee y escribe el documento del usuario autenticado.

## Limitaciones conocidas

- **Chrome y Edge en escritorio** exponen `navigator.getBattery()`. **Safari en iPhone/iPad y Firefox no**, por lo que la sección de batería aparece como no disponible; el historial ya guardado sigue visible.
- La web no puede leer salud de la batería, ciclos ni temperatura.
- El historial crece solo mientras la página está abierta; no hay servicio en segundo plano. Para lectura continua existe la app nativa.
- Las muestras se limitan a 720 por navegador para no exceder el tamaño del documento.

## Estructura

```txt
src/
  App.jsx                 vistas, muestreo y tema
  firebase.js             Auth + Firestore del proyecto de tesis
  hooks/
    useAuth.js            sesión de Google
    useBattery.js         Battery Status API
    useBatteryHistory.js  localStorage + sincronización con Firestore
  components/             Dashboard, HistoryView, SettingsView, gráficas y UI
  lib/                    formato, detección del dispositivo y temas
```

## Proyectos relacionados

- [BatteryLink para Mac e iPhone](https://github.com/Ameri50/aplicacion-de-bateria): lectura real de batería, especificaciones compartidas y transferencia cifrada entre dispositivos.
