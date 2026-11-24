let eventoInstalacionDiferido = null;
const btnInstalar = document.getElementById('btn-instalar');

window.addEventListener('beforeinstallprompt', (event) => {
    // Evita que el mini-banner automático aparezca antes de tiempo
    event.preventDefault();
    eventoInstalacionDiferido = event;

    // Muestra tu botón personalizado de instalación en la UI
    btnInstalar.hidden = false;
});

btnInstalar.addEventListener('click', () => {
    if (!eventoInstalacionDiferido) {
        return;
    }

    // Muestra el cuadro de diálogo nativo de instalación
    eventoInstalacionDiferido.prompt();

    // Espera la decisión del usuario
    eventoInstalacionDiferido.userChoice.then((resultado) => {
        if (resultado.outcome === 'accepted') {
            console.log('El usuario aceptó instalar la PWA.');
            btnInstalar.hidden = true;
        } else {
            console.log('El usuario canceló la instalación de la PWA.');
        }

        // El evento diferido solo puede usarse una vez
        eventoInstalacionDiferido = null;
    });
});

// Registro del Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registro) => {
                console.log('Service Worker registrado con éxito:', registro.scope);
            })
            .catch((error) => {
                console.error('Error al registrar el Service Worker:', error);
            });
    });
}

let streamActual = null;
let modoCamaraActual = 'environment'; // 'environment' = trasera | 'user' = frontal

function actualizarMensajeEstado(mensaje) {
    const estado = document.getElementById('mensaje-estado');
    if (estado) {
        estado.textContent = mensaje;
    }
}

function detenerCamaraActiva() {
    if (streamActual) {
        streamActual.getTracks().forEach((track) => {
            track.stop();
        });
        streamActual = null;
    }
}

function iniciarCamara(modo) {
    detenerCamaraActiva();

    const restricciones = {
        video: { facingMode: modo },
        audio: false
    };

    return navigator.mediaDevices.getUserMedia(restricciones)
        .then((stream) => {
            streamActual = stream;
            const visorVideo = document.getElementById('visor-camara');
            visorVideo.srcObject = stream;
            actualizarMensajeEstado(`Cámara activa (${modo === 'environment' ? 'Trasera' : 'Frontal'})`);
        })
        .catch((error) => {
            if (error.name === 'NotAllowedError') {
                actualizarMensajeEstado('Permiso denegado. Habilita el acceso a la cámara en los ajustes de tu navegador.');
            } else if (error.name === 'NotFoundError') {
                actualizarMensajeEstado('No se detectó el sensor de cámara solicitado en este dispositivo.');
            } else {
                actualizarMensajeEstado(`Error al acceder al hardware: ${error.message}`);
            }
        });
}


// Paso 1: El usuario pulsa "Solicitar Acceso a Cámara" -> Mostramos aviso explicativo
document.getElementById('btn-preparar-camara').addEventListener('click', () => {
    document.getElementById('aviso-permiso').hidden = false;
});

// Paso 2: El usuario lee el motivo y pulsa "Aceptar y Encender Cámara"
document.getElementById('btn-confirmar-permiso').addEventListener('click', () => {
    document.getElementById('aviso-permiso').hidden = true;
    iniciarCamara(modoCamaraActual);
});

// Paso 3: Alternar entre cámara trasera ('environment') y frontal ('user')
document.getElementById('btn-alternar-camara').addEventListener('click', () => {
    modoCamaraActual = modoCamaraActual === 'environment' ? 'user' : 'environment';
    iniciarCamara(modoCamaraActual);
});

// Paso 4: Apagar cámara, liberar el visor y actualizar el estado
document.getElementById('btn-apagar-camara').addEventListener('click', () => {
    detenerCamaraActiva();
    const visorVideo = document.getElementById('visor-camara');
    visorVideo.srcObject = null;
    actualizarMensajeEstado('Cámara apagada.');
});