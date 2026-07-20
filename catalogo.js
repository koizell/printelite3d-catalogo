/* PrintElite3D - catalogo publico (product-first).
   Consume window.CATALOGO (generado por core/catalogo_web.py con whitelist de campos).
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
  /* solo aceptamos rutas relativas que este mismo exportador genera */
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

  /* ---------- productos ---------- */
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

  /* Variaciones SELECCIONABLES: al elegir una cambian la foto grande, el precio
     y la descripcion del producto. Accesible con teclado (Enter / Espacio). */
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
      if (v.contenido) body.appendChild(el("div", "var-sub", v.contenido));
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
    var precios = (p.variantes || [])
      .map(function (v) { return Number(v.precio); })
      .filter(function (n) { return isFinite(n) && n > 0; });
    var base = Number(p.precio);
    var minimo = precios.length ? Math.min.apply(null, precios)
               : (isFinite(base) && base > 0 ? base : null);

    var k = el("span", "pl-k", minimo ? (precios.length > 1 ? "Desde" : "Precio") : "Precio");
    var v = minimo ? el("span", "pl-v", precioTxt(minimo)) : el("span", "pl-v soft", "Consultanos");
    lead.appendChild(k);
    lead.appendChild(v);
    buy.appendChild(lead);

    var a = el("a", "cta");
    a.href = igURL;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.appendChild(iconoIG());
    a.appendChild(document.createTextNode(minimo ? "Pedir por Instagram" : "Consultar por Instagram"));
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
    if (p.descripcion || hayVariantes) info.appendChild(desc);

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
    return art;
  }

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
})();
