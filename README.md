# bateriapagina

Página web de **BatteryLink** hecha con React: muestra la batería real del dispositivo, sus especificaciones y un historial personal por equipo, usando el inicio de sesión con Google y Firestore del proyecto de tesis **`miapp-4a216`**.

La pantalla replica el tablero de la app nativa BatteryLink (anillo de nivel, estado de carga, autonomía, tendencia e historial), pero en el navegador y con datos reales de la Battery Status API.

## Qué incluye

- **Batería en vivo**: nivel, estado de carga, tiempo para completar y autonomía estimada desde `navigator.getBattery()`. Si el navegador no expone la batería, se muestra un aviso y no se inventan datos.
- **Historial real por equipo**: una muestra por minuto mientras la página está abierta (máximo 720). Se guarda en `localStorage` y, con sesión, se sincroniza en tu cuenta.
- **Alarma de batería llena**: aviso visible, tono corto y notificación del sistema (si se concede permiso) cuando la batería llega al 100 %. Se puede activar, silenciar o probar desde Ajustes.
- **Historial de recargas**: sesiones enchufadas detectadas en las muestras, con hora, duración, nivel inicial y final, y si quedó completa o parcial.
- **Ubicación opcional por equipo**: un botón en Ajustes pide permiso al navegador y guarda coordenadas aproximadas con enlace a OpenStreetMap. Cada equipo decide si comparte su ubicación; no se actualiza sola.
- **Modo claro y oscuro**: sigue el tema del sistema en la primera visita y se puede cambiar desde la barra lateral, el encabezado móvil o Ajustes. La preferencia queda en el navegador.
- **Recomendaciones**: hábitos para alargar la vida de la batería, con aviso destacado al completar la carga.
- **Google del proyecto de tesis**: inicio de sesión con Google (popup en escritorio, redirect en móvil) y almacenamiento en `users/{uid}` de Firestore. Sin sesión todo se queda en el navegador.
- **Personalización**: saludo con tu nombre y foto de Google, nombre editable del equipo, color de acento y hasta 6 temas; cada navegador recuerda sus preferencias.
- **Varios equipos a la vez**: el documento del usuario guarda el historial y la ficha de cada dispositivo que entra con la cuenta. La lista «Tus baterías» se actualiza en vivo (nivel, estado, conexión, ubicación y última lectura de cada equipo) y el historial se puede filtrar por equipo.
- **Vistas**:
  - **Inicio**: anillo de batería, especificaciones del navegador, lista de baterías con su ubicación si la compartieron, tendencia de 7 días y recomendaciones.
  - **Historial**: estadísticas de la semana, gráfica de 24 h o 7 días, historial de recargas, resumen por día y últimas lecturas.
  - **Ajustes**: cuenta, nombre del equipo, color, apariencia, alarma, ubicación, exportar JSON y borrar historial con confirmación.
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
      "<deviceId>": {
        alias, model, platform, browser, cores, memoryGB, screen,
        level, charging, updatedAt,
        location: { lat, lng, accuracy, updatedAt } | null
      }
```

El historial se escribe con transacciones que fusionan lo que haya guardado otro equipo (nadie borra las baterías del otro), se escucha con `onSnapshot` para que los equipos aparezcan sin recargar, y se conserva en `localStorage` como respaldo. Cada equipo registra un latido cada 5 minutos y sincroniza cada 90 segundos, al ocultar la pestaña, al cambiar el nombre del equipo y con el botón **Sincronizar ahora**.

> iOS no permite leer la batería desde una página web (Safari, Chrome y Firefox usan WebKit). El iPhone aparece en «Tus baterías», pero su nivel solo puede reportarlo la app nativa BatteryLink.

> Esta versión no modifica ni despliega reglas de Firestore. Solo lee y escribe el documento del usuario autenticado.

## Limitaciones conocidas

- **Chrome y Edge en escritorio** exponen `navigator.getBattery()`. **Safari en iPhone/iPad y Firefox no**, por lo que la sección de batería aparece como no disponible; el historial ya guardado sigue visible.
- La web no puede leer salud de la batería, ciclos ni temperatura.
- El historial crece solo mientras la página está abierta; no hay servicio en segundo plano. Para lectura continua existe la app nativa.
- **La alarma solo suena mientras la página está abierta.** Las notificaciones del sistema requieren permiso y un navegador compatible; en iOS el aviso dentro de la página sigue funcionando, pero su batería no puede leerse desde la web.
- **La ubicación es opcional y aproximada.** Necesita HTTPS (o localhost) y permiso explícito; se guarda la última posición compartida, no un seguimiento continuo. Se muestra como coordenadas con enlace a OpenStreetMap, sin geocodificación inversa ni servicios de mapas de terceros.
- Las muestras se limitan a 720 por navegador para no exceder el tamaño del documento.

## Estructura

```txt
src/
  App.jsx                 vistas, muestreo, tema y aviso de batería llena
  firebase.js             Auth + Firestore del proyecto de tesis
  hooks/
    useAuth.js            sesión de Google
    useBattery.js         Battery Status API
    useBatteryHistory.js  localStorage + sincronización con Firestore
    useChargeAlarm.js     alarma al 100 % (aviso, sonido y notificación)
    useDeviceLocation.js  ubicación opcional del equipo
  components/             Dashboard, HistoryView, SettingsView, BatteryTips, gráficas y UI
  lib/                    formato, dispositivo, tema, alarma y sesiones de recarga
```

## Proyectos relacionados

- [BatteryLink para Mac e iPhone](https://github.com/Ameri50/aplicacion-de-bateria): lectura real de batería, especificaciones compartidas y transferencia cifrada entre dispositivos.
