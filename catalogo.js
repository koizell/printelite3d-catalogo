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

  /* divide un texto en parrafos por saltos de linea; devuelve un DocumentFragment
     con un <p> por parrafo (textContent, nunca innerHTML con datos) */
  function parrafos(texto) {
    var frag = document.createDocumentFragment();
    if (!texto) return frag;
    var partes = String(texto).split(/\n+/);
    for (var i = 0; i < partes.length; i++) {
      var t = partes[i].trim();
      if (!t) continue;
      var p = document.createElement("p");
      p.textContent = t;
      frag.appendChild(p);
    }
    return frag;
  }

  /* extrae un ID de video de YouTube de una URL http(s); null si no aplica */
  function idYouTube(url) {
    if (!url) return null;
    var u = String(url).trim();
    if (!/^https?:\/\//i.test(u)) return null;
    if (!/:\/\/(www\.|m\.|music\.)?youtube\.com\//i.test(u) && !/:\/\/(www\.)?youtu\.be\//i.test(u)) return null;
    var patrones = [
      /(?:youtube\.com\/watch\?[^#]*\bv=)([A-Za-z0-9_-]{6,15})/i,
      /youtu\.be\/([A-Za-z0-9_-]{6,15})/i,
      /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,15})/i
    ];
    for (var i = 0; i < patrones.length; i++) {
      var m = u.match(patrones[i]);
      if (m && m[1]) return m[1];
    }
    return null;
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
  if (elEye && negocio.ciudad) elEye.textContent = "Estudio de impresión 3D en " + negocio.ciudad;
  var elCiudad = document.getElementById("hero-ciudad");
  if (elCiudad && negocio.ciudad) { elCiudad.textContent = negocio.ciudad; elCiudad.removeAttribute("hidden"); }
  var elTel = document.getElementById("hero-telefono");
  if (elTel && negocio.telefono) { elTel.textContent = negocio.telefono; elTel.removeAttribute("hidden"); }

  /* header/footer IG */
  var elTIG = document.getElementById("top-ig"); if (elTIG) elTIG.href = igURL;
  var elCTA = document.getElementById("cta-ig"); if (elCTA) elCTA.href = igURL;
  var elFIG = document.getElementById("footer-ig"); if (elFIG) elFIG.href = igURL;
  var elFIGL = document.getElementById("footer-ig-label"); if (elFIGL) elFIGL.textContent = "@" + igHandle;
  var elFLey = document.getElementById("footer-leyenda");
  if (elFLey && negocio.leyenda) { elFLey.textContent = negocio.leyenda; elFLey.removeAttribute("hidden"); }
  var elYear = document.getElementById("footer-year"); if (elYear) elYear.textContent = new Date().getFullYear();

  /* conteo */
  var elC = document.getElementById("catalogo-conteo");
  function actualizarConteo(n) {
    if (!elC) return;
    if (!n) { elC.textContent = ""; return; }
    elC.textContent = n === 1 ? "1 pieza" : n + " piezas";
  }
  actualizarConteo(productos.length);

  /* grid */
  var grid = document.getElementById("catalogo-grid");
  var filtrosEl = document.getElementById("catalogo-filtros");

  function placeholder(nom) {
    var ph = document.createElement("div");
    ph.className = "card-placeholder";
    ph.textContent = String(nom).charAt(0).toUpperCase() || "•";
    return ph;
  }

  function portadaDe(p) {
    if (p.imagenes && p.imagenes.length && p.imagenes[0]) return p.imagenes[0];
    return p.imagen || null;
  }

  function construirFicha(p) {
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
    return ficha;
  }

  function tarjeta(p) {
    var card = document.createElement("article");
    card.className = "card reveal";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "Ver detalle de " + (p.nombre || "producto"));

    var media = document.createElement("div");
    media.className = "card-media";
    var portada = portadaDe(p);
    /* pintarMedia: muestra una foto (o el placeholder) en la tarjeta; lo reusa el
       selector de variaciones para cambiar la foto al elegir */
    function pintarMedia(src) {
      var badgesPrevios = media.querySelector(".card-badges");
      media.innerHTML = "";
      if (src) {
        var img = document.createElement("img");
        img.className = "card-foto";
        img.src = src; img.alt = p.nombre || "Producto"; img.loading = "lazy";
        img.onerror = function () { if (img.parentNode) img.parentNode.replaceChild(placeholder(p.nombre || "?"), img); };
        media.appendChild(img);
      } else {
        media.appendChild(placeholder(p.nombre || "?"));
      }
      if (badgesPrevios) media.appendChild(badgesPrevios);
    }
    pintarMedia(portada);

    var badges = document.createElement("div");
    badges.className = "card-badges";
    if (p.imagenes && p.imagenes.length > 1) {
      var bFotos = document.createElement("span");
      bFotos.className = "card-badge";
      bFotos.textContent = p.imagenes.length + " fotos";
      badges.appendChild(bFotos);
    }
    if (p.video) {
      var bVideo = document.createElement("span");
      bVideo.className = "card-badge";
      bVideo.textContent = "▶ video";
      badges.appendChild(bVideo);
    }
    if (badges.childNodes.length) media.appendChild(badges);

    card.appendChild(media);

    var body = document.createElement("div");
    body.className = "card-body";
    var h = document.createElement("h3"); h.className = "card-nombre"; h.textContent = p.nombre || ""; body.appendChild(h);
    if (p.descripcion) {
      var primerParrafo = String(p.descripcion).split(/\n+/).map(function (t) { return t.trim(); }).filter(Boolean)[0];
      if (primerParrafo) {
        var d = document.createElement("p"); d.className = "card-desc"; d.textContent = primerParrafo; body.appendChild(d);
      }
    }
    if (p.especificaciones && p.especificaciones.length) {
      body.appendChild(construirFicha(p));
    }
    /* variaciones: selector en la misma tarjeta (Esqueleto, Creeper, pack completo...) */
    var vars = Array.isArray(p.variantes) ? p.variantes : [];
    var varSel = null;
    if (vars.length) {
      varSel = document.createElement("select");
      varSel.className = "card-variantes";
      varSel.setAttribute("aria-label", "Elegir variación de " + (p.nombre || "producto"));
      vars.forEach(function (v, i) {
        var o = document.createElement("option");
        var pv = formatearPrecio(v.precio);
        o.value = String(i);
        o.textContent = (v.nombre || "") + " — " + (pv || "Consultar");
        varSel.appendChild(o);
      });
      varSel.addEventListener("click", function (ev) { ev.stopPropagation(); });
      body.appendChild(varSel);
      /* la primera variación está seleccionada: si tiene foto propia, la tarjeta la muestra */
      if (vars[0] && vars[0].foto) pintarMedia(vars[0].foto);
    }

    var fila = document.createElement("div"); fila.className = "card-precio";
    var pf = formatearPrecio(vars.length ? vars[0].precio : p.precio);
    var val = document.createElement("span");
    val.className = "card-precio-val" + (pf ? "" : " consultar");
    val.textContent = pf || "Consultar";
    fila.appendChild(val);
    if (varSel) {
      varSel.addEventListener("change", function (ev) {
        ev.stopPropagation();
        var v = vars[Number(varSel.value)] || {};
        var pv2 = formatearPrecio(v.precio);
        val.textContent = pv2 || "Consultar";
        val.className = "card-precio-val" + (pv2 ? "" : " consultar");
        pintarMedia(v.foto || portada);   /* elegir la variación muestra SU foto */
      });
    }
    var a = document.createElement("a");
    a.className = "card-pedir"; a.href = igURL; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.textContent = "Pedir →";
    a.addEventListener("click", function (ev) { ev.stopPropagation(); });
    fila.appendChild(a);
    body.appendChild(fila);

    card.appendChild(body);

    card.addEventListener("click", function () { abrirDetalle(p, card); });
    card.addEventListener("keydown", function (ev) {
      if (ev.target !== card) return; /* Enter sobre "Pedir" debe navegar, no abrir el modal */
      if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") {
        ev.preventDefault();
        abrirDetalle(p, card);
      }
    });

    card.dataset.categoria = (p.categoria || "").trim();
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

  /* ==========================================================================
     Filtros por categoria
     ========================================================================== */
  function construirFiltros() {
    if (!filtrosEl || productos.length === 0) return;

    var conteoCategorias = {};
    var sinCategoria = 0;
    productos.forEach(function (p) {
      var c = (p.categoria || "").trim();
      if (c) conteoCategorias[c] = (conteoCategorias[c] || 0) + 1;
      else sinCategoria++;
    });
    var nombresCategorias = Object.keys(conteoCategorias).sort(function (a, b) {
      return a.localeCompare(b, "es");
    });

    var hayVarias = nombresCategorias.length >= 2;
    var hayMixto = nombresCategorias.length >= 1 && sinCategoria > 0;
    if (!hayVarias && !hayMixto) return;

    var cards = grid ? Array.prototype.slice.call(grid.querySelectorAll(".card")) : [];

    function aplicarFiltro(valor, chipActivo) {
      var chips = filtrosEl.querySelectorAll(".chip");
      for (var i = 0; i < chips.length; i++) chips[i].classList.remove("activo");
      chipActivo.classList.add("activo");

      var visibles = 0;
      cards.forEach(function (card) {
        var c = card.dataset.categoria || "";
        var mostrar;
        if (valor === "__todas__") mostrar = true;
        else if (valor === "__otros__") mostrar = !c;
        else mostrar = c === valor;
        card.style.display = mostrar ? "" : "none";
        if (mostrar) visibles++;
      });
      actualizarConteo(visibles);
    }

    function chip(etiqueta, valor) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = etiqueta;
      b.addEventListener("click", function () { aplicarFiltro(valor, b); });
      return b;
    }

    var total = productos.length;
    var chipTodas = chip("Todas (" + total + ")", "__todas__");
    filtrosEl.appendChild(chipTodas);
    nombresCategorias.forEach(function (nombreCat) {
      filtrosEl.appendChild(chip(nombreCat + " (" + conteoCategorias[nombreCat] + ")", nombreCat));
    });
    if (sinCategoria > 0) {
      filtrosEl.appendChild(chip("Otros (" + sinCategoria + ")", "__otros__"));
    }

    chipTodas.classList.add("activo");
    filtrosEl.removeAttribute("hidden");
  }
  construirFiltros();

  /* ==========================================================================
     Modal de detalle
     ========================================================================== */
  var overlayActual = null;
  var escListener = null;
  var origenFoco = null;

  function crearGaleria(p, imagenesGrande) {
    var wrap = document.createElement("div");
    wrap.className = "det-galeria";

    var grande = document.createElement("div");
    grande.className = "det-img";

    function pintarGrande(src) {
      grande.innerHTML = "";
      if (src) {
        var img = document.createElement("img");
        img.src = src; img.alt = p.nombre || "Producto";
        img.onerror = function () { grande.innerHTML = ""; grande.appendChild(placeholder(p.nombre || "?")); };
        grande.appendChild(img);
      } else {
        grande.appendChild(placeholder(p.nombre || "?"));
      }
    }

    var lista = imagenesGrande.length ? imagenesGrande : [null];
    pintarGrande(lista[0]);
    wrap.appendChild(grande);
    wrap.pintarGrande = pintarGrande;   /* las variaciones cambian la foto grande al elegirse */

    if (lista.length > 1) {
      var thumbs = document.createElement("div");
      thumbs.className = "det-thumbs";
      lista.forEach(function (src, idx) {
        var t = document.createElement("button");
        t.type = "button";
        t.className = "det-thumb" + (idx === 0 ? " activo" : "");
        var timg = document.createElement("img");
        timg.src = src; timg.alt = "";
        t.appendChild(timg);
        t.addEventListener("click", function () {
          pintarGrande(src);
          var todos = thumbs.querySelectorAll(".det-thumb");
          for (var i = 0; i < todos.length; i++) todos[i].classList.remove("activo");
          t.classList.add("activo");
        });
        thumbs.appendChild(t);
      });
      wrap.appendChild(thumbs);
    }

    return wrap;
  }

  function crearVideo(p) {
    var idYT = idYouTube(p.video);
    if (idYT) {
      var caja = document.createElement("div");
      caja.className = "det-video";
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + idYT;
      iframe.title = (p.nombre || "Video") + " — video";
      iframe.loading = "lazy";
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
      caja.appendChild(iframe);
      return caja;
    }
    var a = document.createElement("a");
    a.className = "det-video-link";
    a.href = p.video;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "Ver video ↗";
    return a;
  }

  function cerrarDetalle() {
    if (!overlayActual) return;
    var ov = overlayActual;
    ov.classList.remove("vista");
    document.body.style.overflow = "";
    if (escListener) { document.removeEventListener("keydown", escListener); escListener = null; }
    setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 200);
    overlayActual = null;
    if (origenFoco && origenFoco.focus) { origenFoco.focus(); }
    origenFoco = null;
  }

  function abrirDetalle(p, origen) {
    cerrarDetalle();
    origenFoco = origen || null;

    var ov = document.createElement("div");
    ov.className = "detalle-ov";
    ov.addEventListener("click", function (ev) {
      if (ev.target === ov) cerrarDetalle();
    });

    var panel = document.createElement("div");
    panel.className = "detalle";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    if (p.nombre) panel.setAttribute("aria-label", p.nombre);

    var cerrar = document.createElement("button");
    cerrar.type = "button";
    cerrar.className = "detalle-cerrar";
    cerrar.textContent = "×";
    cerrar.setAttribute("aria-label", "Cerrar");
    cerrar.addEventListener("click", cerrarDetalle);
    panel.appendChild(cerrar);

    var izq = document.createElement("div");
    izq.className = "detalle-izq";
    var imagenesGrande = (p.imagenes && p.imagenes.length) ? p.imagenes.slice() : (p.imagen ? [p.imagen] : []);
    var galeria = crearGaleria(p, imagenesGrande);
    izq.appendChild(galeria);
    panel.appendChild(izq);

    var der = document.createElement("div");
    der.className = "detalle-der";

    if (p.categoria) {
      var catEl = document.createElement("p");
      catEl.className = "detalle-cat";
      catEl.textContent = p.categoria;
      der.appendChild(catEl);
    }

    if (p.sku) {
      var refEl = document.createElement("p");
      refEl.className = "detalle-ref";
      refEl.textContent = "Ref. " + p.sku;
      der.appendChild(refEl);
    }

    var nombreEl = document.createElement("h2");
    nombreEl.className = "detalle-nombre";
    nombreEl.textContent = p.nombre || "";
    der.appendChild(nombreEl);

    if (p.descripcion) {
      var descEl = document.createElement("div");
      descEl.className = "detalle-desc";
      descEl.appendChild(parrafos(p.descripcion));
      der.appendChild(descEl);
    }

    if (p.especificaciones && p.especificaciones.length) {
      der.appendChild(construirFicha(p));
    }

    if (p.video) {
      der.appendChild(crearVideo(p));
    }

    /* variaciones en el detalle: chips seleccionables con contenido y precio propios */
    var dvars = Array.isArray(p.variantes) ? p.variantes : [];
    var precioEl = document.createElement("span");
    var contenidoVar = null;
    if (dvars.length) {
      var vwrap = document.createElement("div");
      vwrap.className = "det-variantes";
      var vtit = document.createElement("p");
      vtit.className = "det-var-tit";
      vtit.textContent = "Elige tu versión:";
      vwrap.appendChild(vtit);
      var chipsWrap = document.createElement("div");
      chipsWrap.className = "det-var-chips";
      contenidoVar = document.createElement("p");
      contenidoVar.className = "det-var-contenido";
      var pintarVariante = function (idx) {
        var v = dvars[idx] || {};
        var pvv = formatearPrecio(v.precio);
        precioEl.textContent = pvv || "Consultar";
        precioEl.className = "detalle-precio" + (pvv ? "" : " consultar");
        contenidoVar.textContent = v.contenido || "";
        contenidoVar.style.display = v.contenido ? "" : "none";
        var todos = chipsWrap.querySelectorAll(".det-var-chip");
        for (var ci = 0; ci < todos.length; ci++) todos[ci].classList.toggle("activo", ci === idx);
        /* la foto grande cambia a la de la variación elegida (o vuelve a la portada) */
        if (galeria.pintarGrande) galeria.pintarGrande(v.foto || imagenesGrande[0] || null);
      };
      dvars.forEach(function (v, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "det-var-chip";
        var pv3 = formatearPrecio(v.precio);
        b.textContent = (v.nombre || "") + (pv3 ? " · " + pv3 : "");
        b.addEventListener("click", function () { pintarVariante(i); });
        chipsWrap.appendChild(b);
      });
      vwrap.appendChild(chipsWrap);
      vwrap.appendChild(contenidoVar);
      der.appendChild(vwrap);
    }

    var precioFila = document.createElement("div");
    precioFila.className = "detalle-precio-fila";
    var pf = formatearPrecio(dvars.length ? dvars[0].precio : p.precio);
    precioEl.className = "detalle-precio" + (pf ? "" : " consultar");
    precioEl.textContent = pf || "Consultar";
    precioFila.appendChild(precioEl);
    der.appendChild(precioFila);
    if (dvars.length) {
      /* estado inicial: primera variación activa (chip marcado + contenido + su foto) */
      var chips0 = der.querySelectorAll(".det-var-chip");
      if (chips0.length) chips0[0].classList.add("activo");
      var v0 = dvars[0] || {};
      contenidoVar.textContent = v0.contenido || "";
      contenidoVar.style.display = v0.contenido ? "" : "none";
      if (v0.foto && galeria.pintarGrande) galeria.pintarGrande(v0.foto);
    }

    var pedirEl = document.createElement("a");
    pedirEl.className = "detalle-pedir";
    pedirEl.href = igURL;
    pedirEl.target = "_blank";
    pedirEl.rel = "noopener noreferrer";
    pedirEl.textContent = "Pedir por Instagram";
    der.appendChild(pedirEl);

    panel.appendChild(der);
    ov.appendChild(panel);
    document.body.appendChild(ov);
    document.body.style.overflow = "hidden";
    overlayActual = ov;

    escListener = function (ev) { if (ev.key === "Escape") cerrarDetalle(); };
    document.addEventListener("keydown", escListener);

    requestAnimationFrame(function () { ov.classList.add("vista"); cerrar.focus(); });
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
