Halloween Candy Collector

Prototipo jugable en HTML5/CSS/JS con temática de Halloween. Incluye sprites SVG, controles táctiles y efectos sonoros básicos con WebAudio.

Archivos principales
- `index.html` — página principal y markup de controles táctiles.
- `style.css` — estilos, canvas responsive y estilos de los botones táctiles.
- `main.js` — lógica del juego: jugador, objetos (caramelos, fantasmas), colisiones, audio WebAudio, carga de sprites y entrada táctil.
- `assets/` — SVGs: `candy.svg`, `ghost.svg`, `witch.svg`.
- `Context.md` — (nuevo) historial y contexto de esta conversación.

Cómo ejecutar (Windows PowerShell)

1. Abrir PowerShell en la carpeta del proyecto:

```powershell
Set-Location -LiteralPath "c:/Users/Adolfo Martinez/Desktop/GH/Pruebas/halloween"
```

2. Iniciar un servidor estático (necesitas Python instalado):

```powershell
python -m http.server 8000
```

3. Abrir en el navegador:

http://localhost:8000

Atajos/Controles
- Teclado: ← → o A/D para moverte; Espacio para iniciar/reiniciar.
- Táctil (móvil): botones en pantalla para izquierda/derecha y botón Iniciar.

Notas importantes
- Audio: WebAudio suele requerir una interacción (tap/click) para activarse. Si no escuchas sonidos, haz clic o toca el canvas para habilitar audio.
- Canvas es responsive: el tamaño se adapta al ancho del navegador manteniendo la jugabilidad.

Comandos que se usaron durante la comprobación
- Arrancar servidor: `python -m http.server 8000` (ejecutado en PowerShell)
- Abrir en navegador desde PowerShell: Start-Process 'http://localhost:8000'

Próximos pasos sugeridos
- Guardar highscore en `localStorage`.
- Añadir música ambiental y más efectos SFX.
- Mejorar sprites con spritesheets y animaciones.
- Ajustar dificultad y crear niveles o power-ups.
- Empaquetar como app (Electron) o portar a Unity/Godot para builds nativas.

Si quieres que implemente cualquiera de los siguientes (highscore, audio mejorado, empaquetado, port), di cuál y lo preparo.
