/* =====================================================================
   script.js — Interactividad del perfil profesional de Miguel Aldana
   ---------------------------------------------------------------------
   Organización: cada funcionalidad vive en su propia función
   "iniciarAlgo()". Al final del archivo se ejecutan todas, cada una
   protegida con try/catch: si una falla (por ejemplo, porque se borró
   un elemento del HTML), las demás siguen funcionando.
   ===================================================================== */

'use strict';

document.documentElement.classList.remove('no-js');

// ¿El visitante pidió a su sistema operativo "reducir movimiento"?
const prefiereMenosMovimiento =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ===== 1. MENÚ HAMBURGUESA ===== */
function iniciarMenu() {
    const btnMenu = document.getElementById('btnMenu');
    const navLinks = document.getElementById('navLinks');
    if (!btnMenu || !navLinks) return;

    function abrirMenu() {
        navLinks.classList.add('activo');
        btnMenu.setAttribute('aria-expanded', 'true');
        btnMenu.setAttribute('aria-label', 'Cerrar menú');
    }

    function cerrarMenu(devolverFoco) {
        navLinks.classList.remove('activo');
        btnMenu.setAttribute('aria-expanded', 'false');
        btnMenu.setAttribute('aria-label', 'Abrir menú');
        if (devolverFoco) btnMenu.focus();
    }

    function estaAbierto() {
        return navLinks.classList.contains('activo');
    }

    btnMenu.addEventListener('click', function () {
        if (estaAbierto()) {
            cerrarMenu(false);
        } else {
            abrirMenu();
        }
    });

    // Al elegir una sección, el menú se cierra
    navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            cerrarMenu(false);
        });
    });

    // Tecla Escape: cierra y devuelve el foco al botón (patrón estándar)
    document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape' && estaAbierto()) {
            cerrarMenu(true);
        }
    });

    // Clic fuera del menú: también lo cierra
    document.addEventListener('click', function (evento) {
        if (estaAbierto() && !navLinks.contains(evento.target) && !btnMenu.contains(evento.target)) {
            cerrarMenu(false);
        }
    });

    // Si la ventana se agranda a tamaño escritorio, se resetea el estado
    const escritorio = window.matchMedia('(min-width: 1025px)');
    escritorio.addEventListener('change', function (cambio) {
        if (cambio.matches) cerrarMenu(false);
    });
}


/* ===== 2. APARICIÓN DE SECCIONES AL HACER SCROLL ===== */
function iniciarRevelado() {
    const secciones = document.querySelectorAll('.seccion-oculta');

    // Sin soporte o con movimiento reducido: se muestran todas de inmediato
    if (prefiereMenosMovimiento || !('IntersectionObserver' in window)) {
        secciones.forEach(function (seccion) {
            seccion.classList.add('seccion-visible');
        });
        return;
    }

    const observador = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
            if (entrada.isIntersecting) {
                entrada.target.classList.add('seccion-visible');
                observador.unobserve(entrada.target); // ya apareció, no hace falta seguir observando
            }
        });
    }, { threshold: 0.15 });

    secciones.forEach(function (seccion) {
        observador.observe(seccion);
    });
}


/* ===== 3. HEADER CON SOMBRA AL HACER SCROLL ===== */
function iniciarHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;

    function actualizar() {
        header.classList.toggle('con-scroll', window.scrollY > 10);
    }

    // passive: true le avisa al navegador que no vamos a bloquear el
    // scroll, y así lo puede mantener fluido.
    window.addEventListener('scroll', actualizar, { passive: true });
    actualizar();
}


/* ===== 4. LINK ACTIVO SEGÚN LA SECCIÓN VISIBLE ===== */
function iniciarLinkActivo() {
    if (!('IntersectionObserver' in window)) return;

    const secciones = document.querySelectorAll('main section[id]');
    const links = document.querySelectorAll('.nav-links a');

    const observador = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
            if (!entrada.isIntersecting) return;
            const idActual = entrada.target.id;

            links.forEach(function (link) {
                const esActual = link.getAttribute('href') === '#' + idActual;
                link.classList.toggle('activo', esActual);
                // aria-current indica la sección actual a los lectores de pantalla
                if (esActual) {
                    link.setAttribute('aria-current', 'location');
                } else {
                    link.removeAttribute('aria-current');
                }
            });
        });
    }, { threshold: 0.5 });

    secciones.forEach(function (seccion) {
        observador.observe(seccion);
    });
}


/* ===== 5. CONTADORES ANIMADOS =====
   El HTML ya trae el número final (lo que ven Google y quien no tiene
   JavaScript). Aquí se reinicia a 0 y se anima cuando aparece en pantalla. */
function iniciarContadores() {
    const contadores = document.querySelectorAll('.numero-contador[data-hasta]');
    if (prefiereMenosMovimiento || !('IntersectionObserver' in window)) return;

    function animar(elemento) {
        const meta = parseInt(elemento.dataset.hasta, 10);
        if (Number.isNaN(meta)) return;
        const duracion = 1500;
        const inicio = performance.now();

        function paso(ahora) {
            const progreso = Math.min((ahora - inicio) / duracion, 1);
            elemento.textContent = Math.floor(progreso * meta);
            if (progreso < 1) {
                requestAnimationFrame(paso);
            } else {
                elemento.textContent = meta;
            }
        }
        requestAnimationFrame(paso);
    }

    const observador = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
            if (entrada.isIntersecting) {
                animar(entrada.target);
                observador.unobserve(entrada.target);
            }
        });
    }, { threshold: 0.5 });

    contadores.forEach(function (contador) {
        contador.textContent = '0';
        observador.observe(contador);
    });
}


/* ===== 6. FORMULARIO DE CONTACTO (validación + envío a Formspree) ===== */
function iniciarFormulario() {
    const formulario = document.getElementById('formContacto');
    if (!formulario) return;

    const estado = document.getElementById('estadoFormulario');
    const btnEnviar = formulario.querySelector('button[type="submit"]');
    const textoBoton = btnEnviar.textContent;
    const enlaceWhatsApp = 'https://wa.me/573142389938';
    const TIEMPO_LIMITE_MS = 15000;

    // Reglas de validación: cada campo devuelve un mensaje de error o ''.
    const reglas = {
        nombre: function (valor) {
            if (valor === '') return 'Escribe tu nombre.';
            if (valor.length < 2) return 'El nombre debe tener al menos 2 caracteres.';
            return '';
        },
        email: function (valor) {
            if (valor === '') return 'Escribe tu correo electrónico.';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)) return 'Revisa el correo: debe tener el formato nombre@dominio.com';
            return '';
        },
        mensaje: function (valor) {
            if (valor === '') return 'Cuéntame en qué te puedo ayudar.';
            if (valor.length < 10) return 'El mensaje debe tener al menos 10 caracteres.';
            return '';
        }
    };

    function validarCampo(campo) {
        const error = reglas[campo.name](campo.value.trim());
        const contenedorError = document.getElementById('error-' + campo.name);
        if (contenedorError) contenedorError.textContent = error;
        if (error) {
            campo.setAttribute('aria-invalid', 'true');
        } else {
            campo.removeAttribute('aria-invalid');
        }
        return error === '';
    }

    function mostrarEstado(tipo, html) {
        estado.className = 'estado-formulario ' + tipo;
        estado.innerHTML = html;
    }

    function limpiarEstado() {
        estado.className = 'estado-formulario';
        estado.textContent = '';
    }

    function bloquearBoton(bloqueado) {
        btnEnviar.disabled = bloqueado;
        btnEnviar.textContent = bloqueado ? 'Enviando...' : textoBoton;
    }

    const campos = Object.keys(reglas)
        .map(function (nombre) { return formulario.elements[nombre]; })
        .filter(Boolean);

    // Mientras la persona corrige, el error desaparece en cuanto el campo es válido.
    // Nota: NO se valida al salir del campo (blur). Si el mensaje de error
    // apareciera en ese momento, empujaría el botón "Enviar" hacia abajo
    // justo mientras se le hace clic, y el clic se perdería.
    campos.forEach(function (campo) {
        campo.addEventListener('input', function () {
            if (campo.getAttribute('aria-invalid') === 'true') validarCampo(campo);
        });
    });

    formulario.addEventListener('submit', async function (evento) {
        evento.preventDefault();
        limpiarEstado();

        // 1) Validar todo y llevar el foco al primer campo con error
        const invalidos = campos.filter(function (campo) { return !validarCampo(campo); });
        if (invalidos.length > 0) {
            invalidos[0].focus();
            return;
        }

        // 2) Honeypot: si un bot lo llenó, se simula éxito sin enviar nada
        const trampa = formulario.elements['_gotcha'];
        if (trampa && trampa.value !== '') {
            formulario.reset();
            mostrarEstado('exito', '¡Gracias! Tu mensaje fue enviado.');
            return;
        }

        // 3) Enviar a Formspree con tiempo límite
        const nombre = formulario.elements.nombre.value.trim();
        const controlador = new AbortController();
        const temporizador = setTimeout(function () { controlador.abort(); }, TIEMPO_LIMITE_MS);
        bloquearBoton(true);

        try {
            const respuesta = await fetch(formulario.action, {
                method: 'POST',
                body: new FormData(formulario),
                headers: { 'Accept': 'application/json' },
                signal: controlador.signal
            });

            if (respuesta.ok) {
                formulario.reset();
                const span = document.createElement('span');
                span.textContent = nombre; // textContent evita inyectar HTML escrito por el visitante
                mostrarEstado('exito', '¡Gracias, ' + span.innerHTML + '! Tu mensaje fue enviado. Te responderé pronto.');
            } else {
                mostrarEstado('error',
                    'No se pudo enviar el mensaje. Intenta de nuevo o ' +
                    '<a href="' + enlaceWhatsApp + '" target="_blank" rel="noopener">escríbeme por WhatsApp</a>.');
            }
        } catch (error) {
            const porTiempo = error.name === 'AbortError';
            mostrarEstado('error',
                (porTiempo ? 'El envío tardó demasiado. ' : 'Hubo un problema de conexión. ') +
                'Intenta de nuevo o <a href="' + enlaceWhatsApp + '" target="_blank" rel="noopener">escríbeme por WhatsApp</a>.');
        } finally {
            clearTimeout(temporizador);
            bloquearBoton(false);
        }
    });
}


/* ===== ARRANQUE =====
   Cada módulo se ejecuta aislado: un error en uno no detiene a los demás,
   y queda registrado en la consola con el nombre de la función. */
[
    iniciarMenu,
    iniciarRevelado,
    iniciarHeaderScroll,
    iniciarLinkActivo,
    iniciarContadores,
    iniciarFormulario
].forEach(function (modulo) {
    try {
        modulo();
    } catch (error) {
        console.error('Error en ' + modulo.name + ':', error);
    }
});
