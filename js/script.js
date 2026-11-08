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


/* ===== 6. CONSTELACIÓN DEL FONDO =====
   Puntos que flotan despacio y se unen con líneas cuando están cerca.
   Alrededor del cursor, puntos y líneas se iluminan.
   Hecho con <canvas> y JavaScript puro: sin librerías externas. */
function iniciarConstelacion() {
    const lienzo = document.getElementById('constelacion');
    if (!lienzo || !lienzo.getContext) return;
    const ctx = lienzo.getContext('2d');

    const CONFIG = {
        areaPorPunto: 14000,      // px² de pantalla por cada punto (menos = más puntos)
        maxPuntos: 110,
        distanciaLinea: 140,      // distancia máxima para unir dos puntos
        radioCursor: 190,         // zona que se ilumina alrededor del cursor
        velocidad: 0.25,          // px por cuadro
        color: '94, 234, 212'     // verde azulado (RGB)
    };

    let ancho = 0;
    let alto = 0;
    let puntos = [];
    const cursor = { x: null, y: null };

    // Ajusta el lienzo a la pantalla. devicePixelRatio evita que se vea
    // borroso en pantallas de alta densidad (celulares, Mac).
    function redimensionar() {
        const escala = Math.min(window.devicePixelRatio || 1, 2);
        ancho = window.innerWidth;
        alto = window.innerHeight;
        lienzo.width = ancho * escala;
        lienzo.height = alto * escala;
        ctx.setTransform(escala, 0, 0, escala, 0, 0);

        const cantidad = Math.min(CONFIG.maxPuntos, Math.round((ancho * alto) / CONFIG.areaPorPunto));
        puntos = Array.from({ length: cantidad }, function () {
            const angulo = Math.random() * Math.PI * 2;
            const rapidez = CONFIG.velocidad * (0.4 + Math.random() * 0.6);
            return {
                x: Math.random() * ancho,
                y: Math.random() * alto,
                vx: Math.cos(angulo) * rapidez,
                vy: Math.sin(angulo) * rapidez,
                r: 1 + Math.random() * 1.2
            };
        });
    }

    // Qué tan cerca del cursor está un punto: 1 = encima, 0 = fuera de la zona
    function cercaniaCursor(x, y) {
        if (cursor.x === null) return 0;
        const d = Math.hypot(x - cursor.x, y - cursor.y);
        return d < CONFIG.radioCursor ? 1 - d / CONFIG.radioCursor : 0;
    }

    function dibujar() {
        ctx.clearRect(0, 0, ancho, alto);
        const brillo = puntos.map(function (p) { return cercaniaCursor(p.x, p.y); });

        // Líneas entre puntos cercanos (más transparentes cuanto más lejos)
        for (let i = 0; i < puntos.length; i++) {
            for (let j = i + 1; j < puntos.length; j++) {
                const a = puntos[i];
                const b = puntos[j];
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d > CONFIG.distanciaLinea) continue;

                const base = (1 - d / CONFIG.distanciaLinea) * 0.18;
                const extra = Math.max(brillo[i], brillo[j]) * 0.55;
                ctx.strokeStyle = 'rgba(' + CONFIG.color + ',' + (base + extra) + ')';
                ctx.lineWidth = extra > 0.1 ? 1.2 : 0.8;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
        }

        // Líneas del cursor a los puntos cercanos
        if (cursor.x !== null) {
            puntos.forEach(function (p, i) {
                if (brillo[i] <= 0) return;
                ctx.strokeStyle = 'rgba(' + CONFIG.color + ',' + brillo[i] * 0.35 + ')';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cursor.x, cursor.y);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
            });
        }

        // Puntos: se agrandan y brillan cerca del cursor
        puntos.forEach(function (p, i) {
            const b = brillo[i];
            ctx.fillStyle = 'rgba(' + CONFIG.color + ',' + (0.45 + b * 0.55) + ')';
            ctx.shadowColor = 'rgba(' + CONFIG.color + ', 0.9)';
            ctx.shadowBlur = b * 12;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r + b * 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.shadowBlur = 0;
    }

    function mover() {
        puntos.forEach(function (p) {
            p.x += p.vx;
            p.y += p.vy;
            // Rebotan en los bordes de la pantalla
            if (p.x < 0 || p.x > ancho) p.vx *= -1;
            if (p.y < 0 || p.y > alto) p.vy *= -1;
        });
    }

    // Con movimiento reducido la constelación queda quieta y solo se
    // redibuja cuando se mueve el cursor (para iluminar).
    let pendiente = false;
    function pedirDibujo() {
        if (pendiente) return;
        pendiente = true;
        requestAnimationFrame(function () {
            pendiente = false;
            dibujar();
        });
    }

    function ciclo() {
        mover();
        dibujar();
        requestAnimationFrame(ciclo); // el navegador lo pausa solo si la pestaña no está visible
    }

    // El lienzo está detrás del contenido, por eso se escucha el mouse en
    // toda la ventana. "passive" indica que no se bloquea el scroll.
    window.addEventListener('pointermove', function (e) {
        cursor.x = e.clientX;
        cursor.y = e.clientY;
        if (prefiereMenosMovimiento) pedirDibujo();
    }, { passive: true });

    document.documentElement.addEventListener('pointerleave', function () {
        cursor.x = null;
        cursor.y = null;
        if (prefiereMenosMovimiento) pedirDibujo();
    });

    let temporizador;
    window.addEventListener('resize', function () {
        clearTimeout(temporizador);
        temporizador = setTimeout(function () {
            redimensionar();
            if (prefiereMenosMovimiento) pedirDibujo();
        }, 150);
    });

    redimensionar();
    if (prefiereMenosMovimiento) {
        dibujar();
    } else {
        requestAnimationFrame(ciclo);
    }
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
    iniciarFormulario,
    iniciarConstelacion
].forEach(function (modulo) {
    try {
        modulo();
    } catch (error) {
        console.error('Error en ' + modulo.name + ':', error);
    }
});
