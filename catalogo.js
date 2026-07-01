(function () {
  "use strict";

  /* ---------- utilidades ---------- */
  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function formatearPrecio(v) {
    if (v == null || v === "") return null;
    var n = Number(v);
    if (!isFinite(n) || n <= 0) return null;
    return "$" + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });
  }
  function normalizeIG(raw) {
    if (!raw) return "printelite3d";
    var h = String(raw).trim();
    var m = h.match(/instagram\.com\/([A-Za-z0-9._]+)/);
    if (m) return m[1];
    var limpio = h.replace(/^@/, "").replace(/[^A-Za-z0-9._]/g, "");
    return limpio || "printelite3d";
  }
  function colorPlaceholder(nombre) {
    // neones que brillan sobre el fondo oscuro
    var cols = ["#29e3ff", "#ff2e9a", "#c6ff3d", "#a06bff", "#ff8a3d", "#3dffcf", "#ffd23d", "#5d9bff"];
    var i = 0;
    for (var k = 0; k < nombre.length; k++) i = (i + nombre.charCodeAt(k)) % cols.length;
    return cols[i];
  }

  /* ---------- datos (sin fetch: window.CATALOGO) ---------- */
  var cat = window.CATALOGO || { negocio: {}, productos: [] };
  var negocio = cat.negocio || {};
  var productos = Array.isArray(cat.productos) ? cat.productos : [];
  var igHandle = normalizeIG(negocio.instagram);
  var igURL = "https://www.instagram.com/" + igHandle;

  /* ---------- hero ---------- */
  var elNombre = document.getElementById("nombre-negocio");
  if (elNombre) {
    var nom = (negocio.nombre && negocio.nombre.trim()) ? negocio.nombre.trim() : "PrintElite3D";
    elNombre.textContent = nom;
    document.title = nom + " — Catalogo";
  }
  var elLugar = document.getElementById("hero-lugar");
  if (elLugar && negocio.ciudad) elLugar.textContent = "Hecho a mano en " + negocio.ciudad;

  var elHeroIG = document.getElementById("hero-ig");
  if (elHeroIG) elHeroIG.href = igURL;
  var elCiudad = document.getElementById("hero-ciudad");
  if (elCiudad && negocio.ciudad) { elCiudad.textContent = negocio.ciudad; elCiudad.removeAttribute("hidden"); }
  var elTel = document.getElementById("hero-telefono");
  if (elTel && negocio.telefono) { elTel.textContent = negocio.telefono; elTel.removeAttribute("hidden"); }

  /* ---------- footer ---------- */
  var elFLey = document.getElementById("footer-leyenda");
  if (elFLey && negocio.leyenda) { elFLey.textContent = negocio.leyenda; elFLey.removeAttribute("hidden"); }
  var elFIG = document.getElementById("footer-ig");
  if (elFIG) elFIG.href = igURL;
  var elFIGL = document.getElementById("footer-ig-label");
  if (elFIGL) elFIGL.textContent = "@" + igHandle;
  var elYear = document.getElementById("footer-year");
  if (elYear) elYear.textContent = new Date().getFullYear();

  /* ---------- grid de productos ---------- */
  var grid = document.getElementById("catalogo-grid");

  function crearPlaceholder(nombre) {
    var neon = colorPlaceholder(String(nombre));
    var ph = document.createElement("div");
    ph.className = "card-placeholder";
    ph.style.background = "radial-gradient(circle at 32% 24%, " + neon + "33, transparent 60%), #10101b";
    ph.style.color = neon;
    ph.style.textShadow = "0 0 26px " + neon + "cc";
    ph.textContent = String(nombre).charAt(0).toUpperCase() || "✦";
    return ph;
  }

  function tarjeta(p, idx) {
    var card = document.createElement("article");
    card.className = "card reveal";
    card.style.transitionDelay = (idx % 3) * 0.07 + "s";

    var media = document.createElement("div");
    media.className = "card-media";

    if (p.imagen) {
      var img = document.createElement("img");
      img.className = "card-foto";
      img.src = esc(p.imagen);
      img.alt = esc(p.nombre || "Producto");
      img.loading = "lazy";
      img.onerror = function () {
        if (img.parentNode) img.parentNode.replaceChild(crearPlaceholder(p.nombre || "?"), img);
      };
      media.appendChild(img);
    } else {
      media.appendChild(crearPlaceholder(p.nombre || "?"));
    }

    var precioFmt = formatearPrecio(p.precio);
    var badge = document.createElement("div");
    badge.className = "card-precio" + (precioFmt ? "" : " consultar");
    badge.textContent = precioFmt || "Consultar";
    media.appendChild(badge);
    card.appendChild(media);

    var body = document.createElement("div");
    body.className = "card-body";
    var nombre = document.createElement("h3");
    nombre.className = "card-nombre";
    nombre.textContent = p.nombre || "";
    body.appendChild(nombre);

    if (p.descripcion) {
      var desc = document.createElement("p");
      desc.className = "card-desc";
      desc.textContent = p.descripcion;
      body.appendChild(desc);
    }

    var btn = document.createElement("a");
    btn.className = "card-pedir";
    btn.href = igURL;
    btn.target = "_blank";
    btn.rel = "noopener noreferrer";
    btn.textContent = "Pedir por Instagram →";
    body.appendChild(btn);

    card.appendChild(body);
    return card;
  }

  if (grid) {
    if (productos.length === 0) {
      var vacio = document.createElement("div");
      vacio.className = "vacio";
      var ico = document.createElement("div"); ico.className = "vacio-icono"; ico.textContent = "✦";
      var h = document.createElement("h3"); h.textContent = "Muy pronto";
      var pp = document.createElement("p"); pp.textContent = "Estamos preparando cosas increíbles. Síguenos en Instagram para no perdértelas.";
      vacio.appendChild(ico); vacio.appendChild(h); vacio.appendChild(pp);
      grid.appendChild(vacio);
    } else {
      productos.forEach(function (p, i) { grid.appendChild(tarjeta(p, i)); });
    }
  }

  /* ---------- reveal on scroll / load ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("vista"); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { obs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("vista"); });
  }
}());
