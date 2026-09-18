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

    alert('¡Gracias ' + nombre + '! Tu mensaje fue recibido. Te contactaré pronto.');
    formulario.reset();
});