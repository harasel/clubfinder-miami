/* CLUBFINDER Miami — interactive demo logic */
(function () {
  "use strict";

  /* ---------------- Data ---------------- */

  var CLUBS = [
    {
      id: "bath",
      name: "The Bath Club",
      address: "5937 Collins Ave, Miami Beach, FL 33140",
      coords: [25.8397, -80.1204],
      image: "images/bath-club.jpg",
    },
    {
      id: "surf",
      name: "The Surf Club",
      address: "9011 Collins Ave, Surfside, FL 33154",
      coords: [25.8774, -80.1212],
      image: "images/surf-club.jpg",
    },
    {
      id: "fisher",
      name: "Fisher Island Club",
      address: "1 Fisher Island Dr, Miami Beach, FL 33109",
      coords: [25.7613, -80.1419],
      image: "images/fisher-island.jpg",
    },
    {
      id: "soho",
      name: "Soho Beach House",
      address: "4385 Collins Ave, Miami Beach, FL 33140",
      coords: [25.8194, -80.1224],
      image: "images/soho-beach-house.jpg",
    },
  ];

  var HOME_CENTER = [25.8243, -80.14];
  var HOME_ZOOM = 12.4;
  var FOCUS_ZOOM = 15.5;

  var markers = {};
  var cards = {};
  var activeId = null;
  var map = null;
  var isTouch = window.matchMedia("(hover: none)").matches;

  function getClub(id) {
    for (var i = 0; i < CLUBS.length; i++) {
      if (CLUBS[i].id === id) return CLUBS[i];
    }
    return null;
  }

  /* ---------------- Map ---------------- */

  function initMap() {
    map = L.map("map", {
      center: HOME_CENTER,
      zoom: HOME_ZOOM,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    CLUBS.forEach(function (club) {
      var icon = L.divIcon({
        className: "club-marker",
        html: '<div class="club-marker__pulse"></div><div class="club-marker__pin"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      var marker = L.marker(club.coords, { icon: icon, riseOnHover: true }).addTo(map);
      marker.bindTooltip(club.name, {
        className: "club-tip",
        direction: "top",
        offset: [0, -14],
      });
      marker.on("click", function () {
        selectClub(club.id, { scrollCard: true });
      });
      markers[club.id] = marker;
    });

    document.getElementById("zoom-in").addEventListener("click", function () {
      map.zoomIn();
    });
    document.getElementById("zoom-out").addEventListener("click", function () {
      map.zoomOut();
    });
    document.getElementById("recenter").addEventListener("click", resetMap);
  }

  function flyToClub(club, zoom) {
    if (!map) return;
    map.flyTo(club.coords, zoom || FOCUS_ZOOM, { duration: 1.2, easeLinearity: 0.24 });
  }

  function resetMap() {
    clearActive();
    if (map) map.flyTo(HOME_CENTER, HOME_ZOOM, { duration: 1.1 });
  }

  /* ---------------- Marker / card state ---------------- */

  function setMarkerActive(id, active) {
    var marker = markers[id];
    if (!marker) return;
    var el = marker.getElement();
    if (!el) return;
    el.classList.toggle("is-active", active);
    if (active) el.style.zIndex = 800;
    else el.style.removeProperty("z-index");
  }

  function clearActive() {
    if (activeId) {
      setMarkerActive(activeId, false);
      if (cards[activeId]) cards[activeId].classList.remove("is-active");
    }
    activeId = null;
  }

  function selectClub(id, options) {
    var opts = options || {};
    var club = getClub(id);
    if (!club) return;

    if (activeId !== id) clearActive();
    activeId = id;

    setMarkerActive(id, true);
    if (cards[id]) {
      cards[id].classList.add("is-active");
      if (opts.scrollCard) {
        cards[id].scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    if (opts.moveMap !== false) flyToClub(club, opts.zoom);
    if (markers[id] && opts.openTooltip !== false) markers[id].openTooltip();
  }

  /* ---------------- Club cards ---------------- */

  function arrowSvg() {
    return (
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M5 12h13M12 5l7 7-7 7"/></svg>'
    );
  }

  function renderClubs() {
    var list = document.getElementById("club-list");
    list.innerHTML = "";

    CLUBS.forEach(function (club) {
      var card = document.createElement("button");
      card.className = "club-card";
      card.type = "button";
      card.setAttribute("data-club", club.id);
      card.innerHTML =
        '<div class="club-card__media"><img src="' + club.image + '" alt="' + club.name + '" loading="lazy" /></div>' +
        '<div class="club-card__body">' +
        '<p class="club-card__name">' + club.name + "</p>" +
        '<p class="club-card__address">' + club.address + "</p>" +
        "</div>" +
        '<span class="club-card__arrow">' + arrowSvg() + "</span>";

      if (!isTouch) {
        card.addEventListener("mouseenter", function () {
          selectClub(club.id);
        });
      }
      card.addEventListener("click", function () {
        selectClub(club.id);
      });
      card.addEventListener("focus", function () {
        selectClub(club.id);
      });

      cards[club.id] = card;
      list.appendChild(card);
    });
  }

  /* ---------------- Navigation ---------------- */

  function showView(view) {
    ["discover", "profile", "settings"].forEach(function (name) {
      var el = document.getElementById("view-" + name);
      if (el) el.classList.toggle("is-active", name === view);
    });

    var navMatched = false;
    document.querySelectorAll(".nav__link").forEach(function (btn) {
      var match = !navMatched && btn.getAttribute("data-view") === view;
      if (match) navMatched = true;
      btn.classList.toggle("is-active", match);
    });
    document.querySelectorAll(".mobile-nav__btn").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-view") === view);
    });

    closeUserMenu();

    if (view === "discover" && map) {
      window.setTimeout(function () {
        map.invalidateSize();
      }, 220);
    }
  }

  function bindNavigation() {
    document.addEventListener("click", function (event) {
      var trigger = event.target.closest("[data-view]");
      if (trigger) showView(trigger.getAttribute("data-view"));

      var toastBtn = event.target.closest("[data-toast]");
      if (toastBtn) showToast(toastBtn.getAttribute("data-toast"));

      var toggle = event.target.closest("[data-switch]");
      if (toggle) toggle.classList.toggle("is-on");
    });

    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-tab");
        document.querySelectorAll(".tab").forEach(function (t) {
          t.classList.toggle("is-active", t === tab);
        });
        document.querySelectorAll(".tab-panel").forEach(function (panel) {
          panel.classList.toggle("is-active", panel.getAttribute("data-panel") === target);
        });
      });
    });
  }

  /* ---------------- User menu ---------------- */

  function closeUserMenu() {
    document.getElementById("user-menu").classList.remove("is-open");
  }

  function bindUserMenu() {
    var btn = document.getElementById("avatar-btn");
    var menu = document.getElementById("user-menu");

    btn.addEventListener("click", function (event) {
      event.stopPropagation();
      menu.classList.toggle("is-open");
    });
    document.addEventListener("click", function (event) {
      if (!menu.contains(event.target)) closeUserMenu();
    });
  }

  /* ---------------- Search ---------------- */

  function bindSearch() {
    var input = document.getElementById("search-input");
    var results = document.getElementById("search-results");

    function close() {
      results.classList.remove("is-open");
    }

    function render(query) {
      var q = query.trim().toLowerCase();
      if (!q) return close();

      var matches = CLUBS.filter(function (club) {
        return club.name.toLowerCase().indexOf(q) !== -1 || club.address.toLowerCase().indexOf(q) !== -1;
      });

      results.innerHTML = "";
      if (!matches.length) {
        results.innerHTML = '<div class="search__empty">No matching club.</div>';
      } else {
        matches.forEach(function (club) {
          var item = document.createElement("button");
          item.type = "button";
          item.className = "search__result";
          item.innerHTML = "<strong>" + club.name + "</strong><span>" + club.address + "</span>";
          item.addEventListener("click", function () {
            showView("discover");
            input.value = club.name;
            close();
            window.setTimeout(function () {
              selectClub(club.id, { scrollCard: true });
            }, 120);
          });
          results.appendChild(item);
        });
      }
      results.classList.add("is-open");
    }

    input.addEventListener("input", function () {
      render(input.value);
    });
    input.addEventListener("focus", function () {
      render(input.value);
    });
    input.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });
    document.addEventListener("click", function (event) {
      if (!event.target.closest(".search")) close();
    });
  }

  /* ---------------- Toast ---------------- */

  var toastTimer = null;
  function showToast(message) {
    var toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2400);
  }

  /* ---------------- AI Concierge ---------------- */

  function addMessage(text, role, isTyping) {
    var log = document.getElementById("chat-log");
    var bubble = document.createElement("div");
    bubble.className = "msg msg--" + role + (isTyping ? " msg--typing" : "");
    bubble.textContent = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
    return bubble;
  }

  function conciergeReply(text, action) {
    var typing = addMessage("Typing…", "ai", true);
    window.setTimeout(function () {
      typing.remove();
      addMessage(text, "ai");
      if (typeof action === "function") action();
    }, 650);
  }

  function resolveQuery(query) {
    var q = query.toLowerCase();

    if (q.indexOf("near miami beach") !== -1 || q.indexOf("all club") !== -1 || q.indexOf("show clubs") !== -1) {
      return {
        text: "Here are all four clubs along Miami Beach. Showing the full coastline view.",
        action: resetMap,
      };
    }

    var keywords = [
      { id: "bath", words: ["bath"] },
      { id: "surf", words: ["surf"] },
      { id: "fisher", words: ["fisher", "island"] },
      { id: "soho", words: ["soho", "beach house"] },
    ];

    for (var i = 0; i < keywords.length; i++) {
      for (var j = 0; j < keywords[i].words.length; j++) {
        if (q.indexOf(keywords[i].words[j]) !== -1) {
          var club = getClub(keywords[i].id);
          return {
            text: "On it! Moving the map to " + club.name + " — " + club.address + ".",
            action: function () {
              showView("discover");
              selectClub(club.id, { scrollCard: true });
            },
          };
        }
      }
    }

    return {
      text:
        "I can take you to The Bath Club, The Surf Club, Fisher Island Club or Soho Beach House. " +
        "Which one would you like to see?",
      action: null,
    };
  }

  function handleConciergeQuery(query) {
    addMessage(query, "user");
    var result = resolveQuery(query);
    conciergeReply(result.text, result.action);
  }

  function bindConcierge() {
    var root = document.getElementById("concierge");

    document.getElementById("concierge-open").addEventListener("click", function () {
      root.classList.add("is-open");
      document.getElementById("chat-input").focus();
    });
    document.getElementById("concierge-close").addEventListener("click", function () {
      root.classList.remove("is-open");
    });

    document.querySelectorAll(".quick").forEach(function (btn) {
      btn.addEventListener("click", function () {
        handleConciergeQuery(btn.textContent.trim());
      });
    });

    document.getElementById("chat-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var input = document.getElementById("chat-input");
      var value = input.value.trim();
      if (!value) return;
      input.value = "";
      handleConciergeQuery(value);
    });

    addMessage("Hi! I'm your AI concierge. How can I help you today?", "ai");
  }

  /* ---------------- Boot ---------------- */

  function init() {
    renderClubs();
    initMap();
    bindNavigation();
    bindUserMenu();
    bindSearch();
    bindConcierge();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
