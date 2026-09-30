document.documentElement.classList.remove('no-js');
// ===== MENÚ HAMBURGUESA =====
const btnMenu = document.getElementById('btnMenu');
const navLinks = document.getElementById('navLinks');

btnMenu.addEventListener('click', function() {
    navLinks.classList.toggle('activo');
});

// ===== CERRAR MENÚ AL HACER CLIC EN UN LINK =====
const links = document.querySelectorAll('.nav-links a');

links.forEach(function(link) {
    link.addEventListener('click', function() {
        navLinks.classList.remove('activo');
    });
});

// ===== ANIMACIÓN AL HACER SCROLL =====
const opciones = {
    threshold: 0.15
};

const observador = new IntersectionObserver(function(entradas) {
    entradas.forEach(function(entrada) {
        if (entrada.isIntersecting) {
            entrada.target.classList.add('seccion-visible');
        }
    });
}, opciones);

const seccionesOcultas = document.querySelectorAll('.seccion-oculta');

seccionesOcultas.forEach(function(seccion) {
    observador.observe(seccion);
});

// ===== VALIDACIÓN Y ENVÍO DEL FORMULARIO =====
const formulario = document.querySelector('.formulario-contacto');

formulario.addEventListener('submit', function(evento) {
    evento.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const mensaje = document.getElementById('mensaje').value.trim();

    if (nombre === '' || email === '' || mensaje === '') {
        alert('Por favor completa todos los campos.');
        return;
    }

    const datosFormulario = new FormData(formulario);
    const btnEnviar = formulario.querySelector('button');
    const textoOriginalBoton = btnEnviar.textContent;

    btnEnviar.textContent = 'Enviando...';
    btnEnviar.disabled = true;

    fetch(formulario.action, {
        method: 'POST',
        body: datosFormulario,
        headers: { 'Accept': 'application/json' }
    })
    .then(function(respuesta) {
        if (respuesta.ok) {
            alert('¡Gracias ' + nombre + '! Tu mensaje fue enviado. Te contactaré pronto.');
            formulario.reset();
        } else {
            alert('Hubo un problema al enviar tu mensaje. Intenta de nuevo o escríbeme por WhatsApp.');
        }
    })
    .catch(function() {
        alert('Hubo un problema de conexión. Intenta de nuevo o escríbeme por WhatsApp.');
    })
    .finally(function() {
        btnEnviar.textContent = textoOriginalBoton;
        btnEnviar.disabled = false;
    });
});

// ===== HEADER CON SOMBRA AL HACER SCROLL =====
const header = document.querySelector('header');

window.addEventListener('scroll', function() {
    if (window.scrollY > 10) {
        header.classList.add('con-scroll');
    } else {
        header.classList.remove('con-scroll');
    }
});

// ===== LINK ACTIVO SEGÚN SECCIÓN VISIBLE =====
const todasLasSecciones = document.querySelectorAll('main section');
const todosLosLinks = document.querySelectorAll('.nav-links a');

const observadorMenu = new IntersectionObserver(function(entradas) {
    entradas.forEach(function(entrada) {
        if (entrada.isIntersecting) {
            const idActual = entrada.target.getAttribute('id');

            todosLosLinks.forEach(function(link) {
                link.classList.remove('activo');
                if (link.getAttribute('href') === '#' + idActual) {
                    link.classList.add('activo');
                }
            });
        }
    });
}, { threshold: 0.5 });

todasLasSecciones.forEach(function(seccion) {
    observadorMenu.observe(seccion);
});

// ===== MODO OSCURO =====
const btnTema = document.getElementById('btnTema');
const html = document.documentElement;

const temaGuardado = localStorage.getItem('tema');
if (temaGuardado === 'oscuro') {
    html.setAttribute('data-tema', 'oscuro');
}

btnTema.addEventListener('click', function() {
    const temaActual = html.getAttribute('data-tema');

    if (temaActual === 'oscuro') {
        html.removeAttribute('data-tema');
        localStorage.setItem('tema', 'claro');
    } else {
        html.setAttribute('data-tema', 'oscuro');
        localStorage.setItem('tema', 'oscuro');
    }
});

// ===== CONTADORES ANIMADOS =====
const contadores = document.querySelectorAll('.numero-contador');

function animarContador(elemento) {
    const meta = parseInt(elemento.getAttribute('data-hasta'));
    const duracion = 1500;
    const inicio = performance.now();

    function actualizar(ahora) {
        const progreso = Math.min((ahora - inicio) / duracion, 1);
        const valorActual = Math.floor(progreso * meta);
        elemento.textContent = valorActual;

        if (progreso < 1) {
            requestAnimationFrame(actualizar);
        } else {
            elemento.textContent = meta;
        }
    }

    requestAnimationFrame(actualizar);
}

const observadorContadores = new IntersectionObserver(function(entradas) {
    entradas.forEach(function(entrada) {
        if (entrada.isIntersecting) {
            animarContador(entrada.target);
            observadorContadores.unobserve(entrada.target);
        }
    });
}, { threshold: 0.5 });

contadores.forEach(function(contador) {
    observadorContadores.observe(contador);
});