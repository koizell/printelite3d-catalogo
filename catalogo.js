/* PrintElite3D - catalogo publico.
   Dos vistas: INICIO (bloques editoriales product-first) y CATALOGO (buscador +
   filtros por categoria + cuadricula + detalle). Navegacion por hash (#catalogo).
   SEGURIDAD: todo dato del catalogo se pinta con textContent / propiedades del DOM,
   NUNCA con innerHTML, y las rutas de imagen se validan contra "img/<archivo>". */
(function () {
  "use strict";

  var cat = window.CATALOGO || { negocio: {}, productos: [] };
  var neg = cat.negocio || {};
  var prods = Array.isArray(cat.productos) ? cat.productos : [];

  /* ---------- helpers ---------- */
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null && txt !== "") e.textContent = txt;
    return e;
  }
  function precioTxt(v) {
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
  function srcSeguro(u) {
    u = String(u == null ? "" : u);
    return /^img\/[A-Za-z0-9._-]+$/.test(u) ? u : null;
  }
  function urlSegura(u) {
    u = String(u == null ? "" : u).trim();
    return (/^https?:\/\//i.test(u)) ? u : null;
  }
  function iconoIG() {
    var base = document.querySelector(".ig-icon");
    return base ? base.cloneNode(true) : document.createDocumentFragment();
  }
  function texto(id, valor) {
    var e = document.getElementById(id);
    if (e && valor) e.textContent = valor;
  }
  function precioDesde(p) {
    var precios = (p.variantes || [])
      .map(function (v) { return Number(v.precio); })
      .filter(function (n) { return isFinite(n) && n > 0; });
    var base = Number(p.precio);
    return {
      min: precios.length ? Math.min.apply(null, precios) : (isFinite(base) && base > 0 ? base : null),
      varios: precios.length > 1
    };
  }

  var igUser = normalizeIG(neg.instagram);
  var igURL = "https://www.instagram.com/" + igUser;

  /* ---------- marca, hero y pie ---------- */
  var nombreNeg = (neg.nombre || "PrintElite3D").trim();
  texto("nombre-negocio", nombreNeg);
  texto("footer-nombre", nombreNeg);
  texto("footer-year-nombre", nombreNeg);
  texto("top-ig-label", "@" + igUser);
  texto("footer-ig-label", "@" + igUser);
  ["top-ig", "footer-ig", "cta-ig"].forEach(function (id) {
    var a = document.getElementById(id);
    if (a) a.href = igURL;
  });

  var ciudad = (neg.ciudad || "").trim();
  if (ciudad) {
    texto("hero-eyebrow", "Estudio de impresion 3D · " + ciudad);
    var fc = document.getElementById("fact-ciudad");
    if (fc) { fc.hidden = false; texto("fact-ciudad-txt", "Hecho a mano en " + ciudad); }
  }
  texto("footer-meta", [ciudad, (neg.telefono || "").trim()].filter(Boolean).join(" · "));
  var leyenda = (neg.leyenda || "").trim();
  if (leyenda) {
    var lg = document.getElementById("footer-leyenda");
    if (lg) { lg.hidden = false; lg.textContent = leyenda; }
  }
  var anio = document.getElementById("footer-year");
  if (anio) anio.textContent = String(new Date().getFullYear());

  /* ================= BLOQUE DE PRODUCTO (compartido: inicio y detalle) ================= */
  function bloqueMedia(p) {
    var src = srcSeguro(p.imagen);
    if (src) {
      var media = el("div", "media");
      if (p.categoria) media.appendChild(el("span", "badge", p.categoria));
      var img = el("img");
      img.src = src;
      img.alt = p.nombre || "";
      img.loading = "lazy";
      media.appendChild(img);
      return { nodo: media, img: img };
    }
    var ph = el("div", "media ph");
    ph.setAttribute("role", "img");
    ph.setAttribute("aria-label", "Foto de " + (p.nombre || "el producto") + " proximamente");
    var box = el("div", "ph-in");
    box.appendChild(el("div", "ph-mono", p.nombre || ""));
    box.appendChild(el("div", "ph-note", "Foto proximamente"));
    ph.appendChild(box);
    return { nodo: ph, img: null };
  }

  function listaVariantes(p, refs) {
    var wrap = el("div", "variants");
    var filas = [];
    (p.variantes || []).forEach(function (v) {
      var row = el("div", "var");
      row.setAttribute("role", "button");
      row.setAttribute("tabindex", "0");
      row.setAttribute("aria-pressed", "false");

      var src = srcSeguro(v.foto);
      if (src) {
        var im = el("img", "var-th");
        im.src = src; im.alt = v.nombre || ""; im.loading = "lazy";
        row.appendChild(im);
      } else {
        row.appendChild(el("span", "var-th var-th-none", "sin foto"));
      }
      var body = el("div", "var-body");
      body.appendChild(el("div", "var-name", v.nombre || ""));
      var sub = v.descripcion || v.contenido || "";
      if (sub) body.appendChild(el("div", "var-sub", sub));
      row.appendChild(body);
      row.appendChild(el("div", "var-price", precioTxt(v.precio) || "Consultar"));

      function elegir() {
        filas.forEach(function (f) {
          f.classList.remove("sel");
          f.setAttribute("aria-pressed", "false");
        });
        row.classList.add("sel");
        row.setAttribute("aria-pressed", "true");
        if (refs.img && (src || refs.portada)) refs.img.src = src || refs.portada;
        var pz = precioTxt(v.precio);
        if (refs.pk) refs.pk.textContent = "Precio";
        if (refs.pv) {
          refs.pv.textContent = pz || "Consultanos";
          refs.pv.className = pz ? "pl-v" : "pl-v soft";
        }
        if (refs.desc) {
          refs.desc.textContent = v.descripcion || v.contenido || p.descripcion || "";
        }
      }
      row.addEventListener("click", elegir);
      row.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") {
          ev.preventDefault();
          elegir();
        }
      });
      filas.push(row);
      wrap.appendChild(row);
    });
    return wrap;
  }

  function tablaSpecs(p) {
    var t = el("table", "specs");
    (p.especificaciones || []).forEach(function (e) {
      if (!e || !e.etiqueta) return;
      var tr = el("tr");
      tr.appendChild(el("td", "k", e.etiqueta));
      tr.appendChild(el("td", "v", e.valor || ""));
      t.appendChild(tr);
    });
    return t;
  }

  function filaCompra(p) {
    var buy = el("div", "buy");
    var lead = el("div", "price-lead");
    var pd = precioDesde(p);
    var k = el("span", "pl-k", pd.min ? (pd.varios ? "Desde" : "Precio") : "Precio");
    var v = pd.min ? el("span", "pl-v", precioTxt(pd.min)) : el("span", "pl-v soft", "Consultanos");
    lead.appendChild(k);
    lead.appendChild(v);
    buy.appendChild(lead);

    var a = el("a", "cta");
    a.href = igURL;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.appendChild(iconoIG());
    a.appendChild(document.createTextNode(pd.min ? "Pedir por Instagram" : "Consultar por Instagram"));
    buy.appendChild(a);

    var vid = urlSegura(p.video);
    if (vid) {
      var lv = el("a", "f-meta", "Ver video");
      lv.href = vid; lv.target = "_blank"; lv.rel = "noopener noreferrer";
      buy.appendChild(lv);
    }
    return { nodo: buy, k: k, v: v };
  }

  function bloqueProducto(p, i) {
    var art = el("article", "product" + (i % 2 ? " rev" : ""));
    var media = bloqueMedia(p);
    art.appendChild(media.nodo);

    var info = el("div", "info");
    if (p.categoria) info.appendChild(el("p", "p-cat", p.categoria));
    info.appendChild(el("h3", null, p.nombre || ""));

    var hayVariantes = (p.variantes || []).length > 0;
    var desc = el("p", "p-desc", p.descripcion || "");

    var compra = filaCompra(p);
    if (hayVariantes) {
      info.appendChild(el("p", "var-hint", "Toca una variacion para ver su foto y su precio"));
      info.appendChild(listaVariantes(p, {
        img: media.img,
        portada: srcSeguro(p.imagen),
        desc: desc,
        pk: compra.k,
        pv: compra.v
      }));
    }
    if ((p.especificaciones || []).length) info.appendChild(tablaSpecs(p));
    info.appendChild(compra.nodo);
    art.appendChild(info);
    if (p.descripcion || hayVariantes) art.appendChild(desc);
    return art;
  }

  /* ================= VISTA INICIO ================= */
  var grid = document.getElementById("catalogo-grid");
  if (grid) {
    if (!prods.length) {
      grid.appendChild(el("p", "vacio", "Pronto publicaremos nuestros productos aqui."));
    } else {
      prods.forEach(function (p, i) { grid.appendChild(bloqueProducto(p, i)); });
    }
  }
  var conteo = document.getElementById("catalogo-conteo");
  if (conteo && prods.length) {
    conteo.textContent = prods.length === 1 ? "1 producto" : prods.length + " productos";
  }

  /* ================= VISTA CATALOGO (buscador + chips + tarjetas) ================= */
  var filtroCat = "*";
  var filtroTxt = "";

  function categorias() {
    var vistas = {};
    var out = [];
    prods.forEach(function (p) {
      var c = (p.categoria || "").trim();
      if (c && !vistas[c.toLowerCase()]) { vistas[c.toLowerCase()] = true; out.push(c); }
    });
    return out;
  }

  function coincide(p) {
    if (filtroCat !== "*" && (p.categoria || "").trim() !== filtroCat) return false;
    if (!filtroTxt) return true;
    var q = filtroTxt.toLowerCase();
    if ((p.nombre || "").toLowerCase().indexOf(q) >= 0) return true;
    if ((p.categoria || "").toLowerCase().indexOf(q) >= 0) return true;
    if ((p.descripcion || "").toLowerCase().indexOf(q) >= 0) return true;
    return (p.variantes || []).some(function (v) {
      return (v.nombre || "").toLowerCase().indexOf(q) >= 0;
    });
  }

  function tarjeta(p) {
    var card = el("article", "pcard");
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    var ph = el("div", "pcard-ph");
    var src = srcSeguro(p.imagen);
    if (src) {
      var img = el("img");
      img.src = src; img.alt = p.nombre || ""; img.loading = "lazy";
      ph.appendChild(img);
    } else {
      ph.classList.add("vacia");
      ph.appendChild(el("span", "pcard-ph-txt", p.nombre || ""));
    }
    if (p.categoria) ph.appendChild(el("span", "pcard-cat", p.categoria));
    card.appendChild(ph);

    var b = el("div", "pcard-b");
    b.appendChild(el("div", "pcard-nm", p.nombre || ""));
    var pd = precioDesde(p);
    var pz = el("div", "pcard-pz");
    if (pd.min) {
      if (pd.varios) pz.appendChild(el("small", null, "desde"));
      pz.appendChild(document.createTextNode(precioTxt(pd.min)));
    } else {
      pz.appendChild(document.createTextNode("Consultar"));
      pz.classList.add("soft");
    }
    b.appendChild(pz);
    var nv = (p.variantes || []).length;
    if (nv) b.appendChild(el("div", "pcard-nv", nv === 1 ? "1 variacion" : nv + " variaciones"));
    card.appendChild(b);

    function abrir() { abrirDetalle(p); }
    card.addEventListener("click", abrir);
    card.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") { ev.preventDefault(); abrir(); }
    });
    return card;
  }

  function pintarCards() {
    var cont = document.getElementById("cat-cards");
    var vacio = document.getElementById("cat-vacio");
    if (!cont) return;
    cont.textContent = "";
    var n = 0;
    prods.forEach(function (p) {
      if (!coincide(p)) return;
      n++;
      cont.appendChild(tarjeta(p));
    });
    if (vacio) vacio.hidden = n > 0;
    var c = document.getElementById("cat-conteo");
    if (c) c.textContent = n === 1 ? "1 producto" : n + " productos";
  }

  function pintarChips() {
    var cont = document.getElementById("cat-chips");
    if (!cont) return;
    cont.textContent = "";
    var cats = categorias();
    if (cats.length < 2) return;   // con una sola categoria los chips no aportan
    var todos = el("button", "chip on", "Todos");
    todos.type = "button";
    cont.appendChild(todos);
    var botones = [todos];
    cats.forEach(function (c) {
      var b = el("button", "chip", c);
      b.type = "button";
      botones.push(b);
      cont.appendChild(b);
    });
    botones.forEach(function (b, i) {
      b.addEventListener("click", function () {
        botones.forEach(function (x) { x.classList.toggle("on", x === b); });
        filtroCat = i === 0 ? "*" : b.textContent;
        pintarCards();
      });
    });
  }

  var buscar = document.getElementById("cat-buscar");
  if (buscar) {
    buscar.addEventListener("input", function () {
      filtroTxt = buscar.value.trim();
      pintarCards();
    });
  }
  pintarChips();
  pintarCards();

  /* ================= DETALLE (reusa el bloque editorial) ================= */
  var detOv = document.getElementById("det-ov");
  function abrirDetalle(p) {
    if (!detOv) return;
    texto("det-titulo", p.nombre || "Producto");
    var body = document.getElementById("det-body");
    body.textContent = "";
    body.appendChild(bloqueProducto(p, 0));
    detOv.hidden = false;
    document.body.classList.add("sin-scroll");
    var x = document.getElementById("det-x");
    if (x) x.focus();
  }
  function cerrarDetalle() {
    if (!detOv || detOv.hidden) return;
    detOv.hidden = true;
    document.body.classList.remove("sin-scroll");
  }
  var detX = document.getElementById("det-x");
  if (detX) detX.addEventListener("click", cerrarDetalle);
  if (detOv) detOv.addEventListener("mousedown", function (e) { if (e.target === detOv) cerrarDetalle(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarDetalle(); });

  /* ================= NAVEGACION POR PESTANA (hash) ================= */
  function ruta() {
    var enCat = location.hash === "#catalogo";
    var vi = document.getElementById("vista-inicio");
    var vc = document.getElementById("vista-catalogo");
    if (vi) vi.hidden = enCat;
    if (vc) vc.hidden = !enCat;
    var ni = document.getElementById("nav-inicio");
    var nc = document.getElementById("nav-catalogo");
    if (ni) ni.classList.toggle("activo", !enCat);
    if (nc) nc.classList.toggle("activo", enCat);
    cerrarDetalle();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", ruta);
  ruta();
})();
