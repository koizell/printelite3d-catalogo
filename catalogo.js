(function () {
  "use strict";

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

  var cat = window.CATALOGO || { negocio: {}, productos: [] };
  var negocio = cat.negocio || {};
  var productos = Array.isArray(cat.productos) ? cat.productos : [];
  var igHandle = normalizeIG(negocio.instagram);
  var igURL = "https://www.instagram.com/" + igHandle;
  var nombre = (negocio.nombre && negocio.nombre.trim()) ? negocio.nombre.trim() : "PrintElite3D";

  /* marca / nombre */
  var elN = document.getElementById("nombre-negocio"); if (elN) elN.textContent = nombre;
  var elFN = document.getElementById("footer-nombre"); if (elFN) elFN.textContent = nombre;
  document.title = nombre + " — Catalogo";
  var inicial = nombre.charAt(0).toUpperCase() || "P";
  var marcas = document.querySelectorAll(".logo-mark");
  for (var mi = 0; mi < marcas.length; mi++) marcas[mi].textContent = inicial;

  /* hero */
  var elEye = document.getElementById("hero-eyebrow");
  if (elEye && negocio.ciudad) elEye.textContent = "Estudio de impresion 3D en " + negocio.ciudad;
  var elCiudad = document.getElementById("hero-ciudad");
  if (elCiudad && negocio.ciudad) { elCiudad.textContent = negocio.ciudad; elCiudad.removeAttribute("hidden"); }
  var elTel = document.getElementById("hero-telefono");
  if (elTel && negocio.telefono) { elTel.textContent = negocio.telefono; elTel.removeAttribute("hidden"); }

  /* header/footer IG */
  var elTIG = document.getElementById("top-ig"); if (elTIG) elTIG.href = igURL;
  var elFIG = document.getElementById("footer-ig"); if (elFIG) elFIG.href = igURL;
  var elFIGL = document.getElementById("footer-ig-label"); if (elFIGL) elFIGL.textContent = "@" + igHandle;
  var elFLey = document.getElementById("footer-leyenda");
  if (elFLey && negocio.leyenda) { elFLey.textContent = negocio.leyenda; elFLey.removeAttribute("hidden"); }
  var elYear = document.getElementById("footer-year"); if (elYear) elYear.textContent = new Date().getFullYear();

  /* conteo */
  var elC = document.getElementById("catalogo-conteo");
  if (elC && productos.length) elC.textContent = productos.length === 1 ? "1 pieza" : productos.length + " piezas";

  /* grid */
  var grid = document.getElementById("catalogo-grid");

  function placeholder(nom) {
    var ph = document.createElement("div");
    ph.className = "card-placeholder";
    ph.textContent = String(nom).charAt(0).toUpperCase() || "•";
    return ph;
  }

  function tarjeta(p) {
    var card = document.createElement("article");
    card.className = "card reveal";

    var media = document.createElement("div");
    media.className = "card-media";
    if (p.imagen) {
      var img = document.createElement("img");
      img.className = "card-foto";
      img.src = esc(p.imagen); img.alt = esc(p.nombre || "Producto"); img.loading = "lazy";
      img.onerror = function () { if (img.parentNode) img.parentNode.replaceChild(placeholder(p.nombre || "?"), img); };
      media.appendChild(img);
    } else {
      media.appendChild(placeholder(p.nombre || "?"));
    }
    card.appendChild(media);

    var body = document.createElement("div");
    body.className = "card-body";
    var h = document.createElement("h3"); h.className = "card-nombre"; h.textContent = p.nombre || ""; body.appendChild(h);
    if (p.descripcion) {
      var d = document.createElement("p"); d.className = "card-desc"; d.textContent = p.descripcion; body.appendChild(d);
    }
    if (p.especificaciones && p.especificaciones.length) {
      var ficha = document.createElement("dl");
      ficha.className = "card-ficha";
      for (var si = 0; si < p.especificaciones.length; si++) {
        var spec = p.especificaciones[si];
        var fila_spec = document.createElement("div");
        fila_spec.className = "ficha-fila";
        var et = document.createElement("span");
        et.className = "ficha-et";
        et.textContent = spec.etiqueta == null ? "" : String(spec.etiqueta);
        var val_spec = document.createElement("span");
        val_spec.className = "ficha-val";
        val_spec.textContent = spec.valor == null ? "" : String(spec.valor);
        fila_spec.appendChild(et);
        fila_spec.appendChild(val_spec);
        ficha.appendChild(fila_spec);
      }
      body.appendChild(ficha);
    }
    var fila = document.createElement("div"); fila.className = "card-precio";
    var pf = formatearPrecio(p.precio);
    var val = document.createElement("span");
    val.className = "card-precio-val" + (pf ? "" : " consultar");
    val.textContent = pf || "Consultar";
    fila.appendChild(val);
    var a = document.createElement("a");
    a.className = "card-pedir"; a.href = igURL; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.textContent = "Pedir →";
    fila.appendChild(a);
    body.appendChild(fila);

    card.appendChild(body);
    return card;
  }

  if (grid) {
    if (productos.length === 0) {
      var vacio = document.createElement("div"); vacio.className = "vacio reveal";
      var vh = document.createElement("h3"); vh.textContent = "Muy pronto";
      var vp = document.createElement("p"); vp.textContent = "Estamos preparando el catalogo. Siguenos en Instagram para ser el primero en verlo.";
      vacio.appendChild(vh); vacio.appendChild(vp); grid.appendChild(vacio);
    } else {
      productos.forEach(function (p) { grid.appendChild(tarjeta(p)); });
    }
  }

  /* reveal */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("vista"); obs.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });
    reveals.forEach(function (el) { obs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("vista"); });
  }
}());
