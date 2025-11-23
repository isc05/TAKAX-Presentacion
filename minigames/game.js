let gameContainer, tablero, splashScreen, closeGameBtn, memoramaBox, quizBox;

document.addEventListener("DOMContentLoaded", () => {
    gameContainer = document.getElementById("game");
    tablero = document.getElementById("tablero");
    splashScreen = document.getElementById("splash-screen");
    closeGameBtn = document.getElementById("close-game");
    memoramaBox = document.getElementById("memorama");
    quizBox = document.getElementById("quiz");
    // Helpers to open/close with transition
    function openGame(gameType) {
        if (!gameContainer) return;
        // Make visible (remove hidden) and then add show to trigger transition
        gameContainer.classList.remove('hidden');
        // Force reflow so transitions apply when adding class
        void gameContainer.offsetWidth;
        gameContainer.classList.add('show');
        // Load game content based on type
        if (gameType === 'memorama') {
            iniciarMemorama();
        }
    }
    function closeGame() {
        if (!gameContainer) return;
        // Remove show, wait for transition end, then hide (add hidden)
        gameContainer.classList.remove('show');
        splashScreen.classList.remove('show');
        const onTransitionEnd = (e) => {
            if (e.propertyName === 'opacity') {
                // Solo ocultar si el contenedor NO se volvió a mostrar durante la transición
                if (!gameContainer.classList.contains('show')) {
                    gameContainer.classList.add('hidden');
                    if (tablero) tablero.innerHTML = '';
                    splashScreen.classList.add('hidden');
                }
                gameContainer.removeEventListener('transitionend', onTransitionEnd);
            }
        };
        // Usamos { once: true } por seguridad, y el handler también se remueve manualmente
        gameContainer.addEventListener('transitionend', onTransitionEnd, { once: true });
    }

    if (memoramaBox) {
        memoramaBox.addEventListener('click', () => openGame('memorama'));
    }
    if (quizBox) {
        quizBox.addEventListener('click', () => openGame('quiz'));
    }
    if (closeGameBtn) {
        closeGameBtn.addEventListener('click', closeGame);
    }
});
// --- CONFIGURACIÓN DEL JUEGO ---
const cartasIMG = {
    card1: 'minigames/src/img1-mem-takax.jpeg',
    card2: 'minigames/src/img2-mem-takax.jpeg',
    card3: 'minigames/src/img3-mem-takax.jpeg',
    card4: 'minigames/src/img4-mem-takax.jpeg',
    card5: 'minigames/src/img5-mem-takax.jpeg',
    card6: 'minigames/src/img6-mem-takax.jpeg'
};
const IMG_DEFAULT = 'minigames/src/background-image-mem.jpeg';
const maxPuntos = Object.keys(cartasIMG).length * 100;
// --- VARIABLES DE ESTADO DEL JUEGO ---
let cartasDeshabilitadas = false;
let cartaVolteada1 = null;
let cartaVolteada2 = null;
let puntos = 0;

function mostrarSplashScreen(mostrar, mensaje = "") {
    if (!splashScreen) return;
    const mensajeEl = splashScreen.querySelector('#splash-message');
    if (mostrar) {
        if (mensajeEl) mensajeEl.textContent = mensaje;
        splashScreen.classList.add('show');
    } else {
        splashScreen.classList.remove('show');
    }
}
function iniciarMemorama() {
    console.log("Iniciando Memorama...");
    // 1. Reiniciar estado
    puntos = 0;
    cartaVolteada1 = null;
    cartaVolteada2 = null;
    cartasDeshabilitadas = false;

    // 3. Generar nuevo tablero
    generarTablero();
}
function generarTablero() {
    // 1. Limpiar tablero anterior
    tablero.innerHTML = '';
    // Remover listener anterior si se usa (aunque con innerHTML se limpian)
    // Para delegación de eventos, lo asignamos una sola vez fuera si no cambiamos el tableroEl
    // Pero como lo asignaremos ahora, nos aseguramos de que solo haya uno.
    tablero.onclick = manejarClicCarta; // Asigna el manejador de eventos

    // 2. Preparar array de cartas
    const IMGs = Object.keys(cartasIMG);
    const IMGsDups = [...IMGs, ...IMGs]; // Duplicar
    mezclarArray(IMGsDups);

    // 3. Crear y añadir cada carta al DOM
    for (const nombreCarta of IMGsDups) {
        const rutaImagen = cartasIMG[nombreCarta];

        // Creamos la estructura HTML de la carta
        const cartaContainer = document.createElement('div');
        cartaContainer.classList.add('carts-container');
        cartaContainer.dataset.value = nombreCarta; // Guardamos el valor para comparar

        cartaContainer.innerHTML = `
            <img src="${rutaImagen}" class="carts-face carts-front" draggable="false">
            <img src="${IMG_DEFAULT}" class="carts-face carts-back" draggable="false">
        `;

        tablero.appendChild(cartaContainer);
    }
}
/**
 * Manejador central de clics en el tablero (Delegación de Eventos).
 * @param {Event} event - El objeto del evento click.
 */
function manejarClicCarta(event) {
    // 1. Encontrar el contenedor de la carta que fue clickeado
    const cartaClickeada = event.target.closest('.carts-container');

    // 2. Validar el clic
    if (!cartaClickeada || // Clic fuera de una carta
        cartasDeshabilitadas || // Clics bloqueados
        cartaClickeada === cartaVolteada1 || // Clic en la misma carta
        cartaClickeada.classList.contains('voltear')) // Clic en una carta ya volteada/encontrada
    {
        return;
    }

    // 3. Voltear la carta
    cartaClickeada.classList.add('voltear');

    // 4. Lógica de juego
    if (!cartaVolteada1) {
        // Es la primera carta
        cartaVolteada1 = cartaClickeada;
    } else {
        // Es la segunda carta
        cartaVolteada2 = cartaClickeada;
        cartasDeshabilitadas = true; // Bloquear clics mientras se compara

        // 5. Comparar las cartas
        comprobarCoincidencia();
    }
}
/**
 * Comprueba si las dos cartas volteadas son un par.
 */
function comprobarCoincidencia() {
    const esCoincidencia = cartaVolteada1.dataset.value === cartaVolteada2.dataset.value;

    if (esCoincidencia) {
        // ¡Es un par!
        puntos += 100;
        deshabilitarCartasCoincidentes();
        comprobarSiGano();
    } else {
        // No es un par
        voltearCartasIncorrectas();
    }
}
/**
 * Deja las cartas volteadas y las resetea para la siguiente jugada.
 */
function deshabilitarCartasCoincidentes() {
    // Las cartas ya tienen la clase 'voltear', solo reseteamos las variables
    resetearTurno();
}
/**
 * Oculta las cartas después de un breve momento.
 */
function voltearCartasIncorrectas() {
    setTimeout(() => {
        cartaVolteada1.classList.remove('voltear');
        cartaVolteada2.classList.remove('voltear');
        resetearTurno();
    }, 800); // Dar tiempo a ver la segunda carta
}
/**
 * Resetea las variables de turno y re-habilita los clics.
 */
function resetearTurno() {
    [cartaVolteada1, cartaVolteada2] = [null, null];
    cartasDeshabilitadas = false;
}
/**
 * Comprueba si el jugador ha ganado la partida.
 */
function comprobarSiGano() {
    if (puntos === maxPuntos) {
        // Espera 1 segundo para mostrar la última carta antes de la pantalla de victoria
        setTimeout(() => {
            mostrarSplashScreen(true, "¡Felicidades, has ganado!");
        }, 500);
    }
}
/**
 * Algoritmo de Fisher-Yates para mezclar el array (in-place).
 * @param {Array} array - El array a mezclar.
 */
function mezclarArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}