"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MapGL, { Layer, Popup, Source, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Menu, ChevronDown, ChevronUp } from "lucide-react";
import { useIsMobile } from "@/lib/useIsMobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Place = {
  id: string | null;
  category: string;
  organization: string;
  office: string;
  address: string;
  email: string | null;
  website: string | null;
  place_id: string | null;
  opening_hours: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  maps_url: string | null;
  photo_ref: string | null;
  service_tags: string[];
};

type TagGuide = {
  tag: string;
  display_name: string;
  description?: string;
  example_keywords?: string;
};

function getPhotoSrc(photoRef: string | null, placeId: string | null): string | null {
  const pid = (placeId || "").toString().trim();
  const ref = (photoRef || "").toString().trim();

  // If the dataset later stores real URLs, render them directly.
  if (ref && (ref.startsWith("http://") || ref.startsWith("https://"))) return ref;

  // Preferred path: use placeId so the server can fetch a fresh photo name via Places Details (New).
  if (pid) {
    const qs = new URLSearchParams();
    qs.set("placeId", pid);
    qs.set("w", "300");
    // Keep legacy ref as a hint (some places may still work); route.ts will ignore/refallback as needed.
    if (ref) qs.set("ref", ref);
    return `/api/photo?${qs.toString()}`;
  }

  // Fallback: legacy photo_reference only (may expire)
  if (ref) return `/api/photo?ref=${encodeURIComponent(ref)}&w=300`;

  return null;
}

function safeUrl(raw: string | null): string | null {
  const u = (raw || "").toString().trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

function categoryColor(category: string): string {
  const raw = (category || "").toString().toLowerCase().trim();
  // Normalize common separators so "food-access", "food access", and "food_access" all match.
  const c = raw.replace(/[\s\-]+/g, "_").replace(/_+/g, "_");

  if (c.includes("library")) return "#2CA3E0"; // light blue

  // Food access may appear in multiple formats.
  if (
    c.includes("food_access") ||
    c === "food" ||
    c.startsWith("food_") ||
    c.endsWith("_food")
  )
    return "#2563EB";

  if (c.includes("government") || c.includes("city") || c.includes("state")) return "#99c24d";
  if (c.includes("education") || c.includes("adult")) return "#E11D48";
  if (c.includes("community") || c.includes("nonprofit") || c.includes("organization")) return "#0F766E";

  return "#111827"; // neutral
}

function categoryIcon(category: string): string {
  const raw = (category || "").toString().toLowerCase().trim();
  const c = raw.replace(/[\s\-]+/g, "_").replace(/_+/g, "_");

  if (c.includes("library")) return "📚";

  if (
    c.includes("food_access") ||
    c === "food" ||
    c.startsWith("food_") ||
    c.endsWith("_food")
  )
    return "🥫";

  if (c.includes("government") || c.includes("city") || c.includes("state")) return "🏛️";
  if (c.includes("education") || c.includes("adult")) return "🎓";
  if (c.includes("community") || c.includes("nonprofit") || c.includes("organization")) return "🤝";

  return "📍";
}

function safeNum(n: any): number | null {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : null;
}

function placeKey(p: Place): string {
  const pid = (p.id || p.place_id || "").toString().trim();
  const org = (p.organization || "").toString().trim();
  const office = (p.office || "").toString().trim();
  const addr = (p.address || "").toString().trim();

  // Some datasets reuse the same Google Place ID for multiple offices/rows.
  // React keys must be unique, so we always include office/address to disambiguate.
  if (pid) return `${pid}__${office || org}__${addr}`;

  // Fallback stable key when ids are missing
  return `${org}__${office}__${addr}`;
}

function hashColor(input: string): string {
  // Deterministic, readable HSL color per label
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 70% 45%)`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeWedge(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

export default function DashboardPage() {
  const isMobile = useIsMobile();
  const [places, setPlaces] = useState<Place[]>([]);
  const [tagGuide, setTagGuide] = useState<TagGuide[]>([]);
  const [loading, setLoading] = useState(true);

  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [showMunicipalities, setShowMunicipalities] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(!isMobile);
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("arrival_sidebar_width");
      const v = Number(raw);
      if (Number.isFinite(v) && v >= 260 && v <= 520) return v;
    }
    return 360; // default wider sidebar
  });
  
  const resizeState = useRef({ dragging: false, startX: 0, startWidth: 360 });
  
  const mapRef = useRef<MapRef | null>(null);
  const [mapBounds, setMapBounds] = useState<
    | { west: number; south: number; east: number; north: number }
    | null
  >(null);
  const [nearQuery, setNearQuery] = useState("");
  const [nearError, setNearError] = useState<string | null>(null);
  const [nearLoading, setNearLoading] = useState(false);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
  const hasMapboxToken = mapboxToken.trim().length > 0;

  async function geocodeAndFly() {
    const q = nearQuery.trim();
    if (!q) return;

    if (!hasMapboxToken) {
      setNearError("Mapbox token missing. Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local and restart.");
      return;
    }

    setNearLoading(true);
    setNearError(null);

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${encodeURIComponent(
        mapboxToken
      )}&autocomplete=true&limit=1&types=address,postcode,place,locality,neighborhood`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
      const data = await res.json();
      const feat = data?.features?.[0];
      const center = feat?.center;
      if (!Array.isArray(center) || center.length < 2) {
        setNearError("No results found. Try a different address or ZIP.");
        return;
      }

      const [lng, lat] = center;
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 12, duration: 900 });
    } catch (e: any) {
      setNearError(e?.message || "Geocoding failed");
    } finally {
      setNearLoading(false);
    }
  }

  function clearNameSearch() {
    setQueryInput("");
    setQuery("");
    setActivePlaceId(null);
  }

  function clearNearSearch() {
    setNearQuery("");
    setNearError(null);
    // Reset map to initial view
    mapRef.current?.flyTo({ 
      center: [-71.0589, 42.3601], 
      zoom: 9.5, 
      duration: 900 
    });
  }

  useEffect(() => {
    async function load() {
      setLoading(true);

      const [placesRes, tagsRes] = await Promise.all([
        fetch("/data/places_public.json"),
        fetch("/data/tags.json"),
      ]);

      const placesData = (await placesRes.json()) as Place[];
      const tagsData = (await tagsRes.json()) as TagGuide[];

      // Helper to normalize tag keys for canonicalization
      function normalizeTagKey(input: string): string {
        return (input || "")
          .toString()
          .replace(/\u00A0/g, " ") // NBSP
          .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars + BOM
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ");
      }


      const displayToTag = new Map<string, string>();
      const tagLowerToTag = new Map<string, string>();

      for (const tg of tagsData) {
        const canonical = (tg.tag || "").trim();
        if (!canonical) continue;

        // Map the tag itself (case-insensitive) to the canonical id
        tagLowerToTag.set(normalizeTagKey(canonical), canonical);

        // Also map common variants: underscores vs spaces
        tagLowerToTag.set(normalizeTagKey(canonical.replace(/_/g, " ")), canonical);

        if (tg.display_name) {
          const dn = tg.display_name.trim();
          displayToTag.set(normalizeTagKey(dn), canonical);
          displayToTag.set(normalizeTagKey(dn.replace(/_/g, " ")), canonical);
          // Sometimes data contains display names but with underscores
          displayToTag.set(normalizeTagKey(dn.replace(/\s+/g, "_")), canonical);
        }
      }

      function canonicalizeTag(raw: string): string {
        const cleaned = (raw || "").toString().replace(/\u00A0/g, " ");
        const key = normalizeTagKey(cleaned);
        if (!key) return "";

        // Try display-name mapping first, then tag mapping
        return (
          displayToTag.get(key) ||
          tagLowerToTag.get(key) ||
          // final fallback: normalize spaces to underscores for consistency
          key.replace(/\s+/g, "_")
        );
      }

      // Canonicalize place tags
      for (const p of placesData) {
        if (p.service_tags && Array.isArray(p.service_tags)) {
          p.service_tags = p.service_tags.map((t) => canonicalizeTag(t)).filter((t) => t);
        }
      }

      setPlaces(placesData);
      setTagGuide(tagsData);
      setLoading(false);
    }

    load().catch((e) => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("arrival_sidebar_width", String(sidebarWidth));
    }
  }, [sidebarWidth]);

  // Update legend state when mobile state changes
  useEffect(() => {
    setLegendOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!resizeState.current.dragging) return;
      const delta = e.clientX - resizeState.current.startX;
      const next = Math.max(260, Math.min(520, resizeState.current.startWidth + delta));
      setSidebarWidth(next);
    }

    function onUp() {
      resizeState.current.dragging = false;
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);


  const tagLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of tagGuide) m.set(t.tag, t.display_name || t.tag);
    return m;
  }, [tagGuide]);

  const tagMeta = useMemo(() => {
    const m = new Map<string, TagGuide>();
    for (const t of tagGuide) m.set(t.tag, t);
    return m;
  }, [tagGuide]);


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return places.filter((p) => {
      const org = ((p as any).organization ?? (p as any).organisation ?? "").toString();
      const office = (p.office ?? "").toString();
      const hay = `${org} ${office}`.toLowerCase();
      const matchText = !q || hay.includes(q);

      const matchTags =
        selectedTags.length === 0 ||
        selectedTags.every((t) => (p.service_tags || []).includes(t));

      return matchText && matchTags;
    });
  }, [places, query, selectedTags]);

  const filteredUnique = useMemo(() => {
    const seen = new Set<string>();
    const out: Place[] = [];
    for (const p of filtered) {
      const k = placeKey(p);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(p);
    }
    return out;
  }, [filtered]);

  const placesInView = useMemo(() => {
    // Only apply viewport filtering when in Map view and we have bounds.
    if (viewMode !== "map" || !mapBounds) return filteredUnique;
  
    const { west, south, east, north } = mapBounds;
  
    return filteredUnique.filter((p) => {
      const lat = safeNum(p.lat);
      const lng = safeNum(p.lng);
      if (lat === null || lng === null) return false;
      return lng >= west && lng <= east && lat >= south && lat <= north;
    });
  }, [filteredUnique, mapBounds, viewMode]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of placesInView) for (const t of p.service_tags || []) set.add(t);
    return Array.from(set).sort((a, b) => {
      const la = (tagLabel.get(a) ?? a).toLowerCase();
      const lb = (tagLabel.get(b) ?? b).toLowerCase();
      return la.localeCompare(lb);
    });
  }, [placesInView, tagLabel]);

  const countsByCategory = useMemo<Array<[string, number]>>(() => {
    const m = new Map<string, number>();
    for (const p of placesInView) {
      const key = p.category || "Uncategorized";
      m.set(key, (m.get(key) || 0) + 1);
    }
  
    const entries: Array<[string, number]> = Array.from(m.entries());
    entries.sort((a, b) => b[1] - a[1]);
    return entries;
  }, [placesInView]);

  // --- Mapbox clustering setup ---
  const placesGeoJSON = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: filteredUnique
        .filter((p) => safeNum(p.lat) !== null && safeNum(p.lng) !== null)
        .map((p) => {
          const lat = safeNum(p.lat) as number;
          const lng = safeNum(p.lng) as number;
          const pid = placeKey(p);
          return {
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [lng, lat] as [number, number],
            },
            properties: {
              pid,
              category: p.category || "",
              color: categoryColor(p.category || ""),
            },
          };
        }),
    };
  }, [filteredUnique]);

  const clusterLayer: any = {
    id: "clusters",
    type: "circle",
    source: "places",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#bc660d", // small clusters 
        20,
        "#a4590b", // medium clusters 
        75,
        "#7f4508", // large clusters
      ],
      "circle-radius": [
        "step",
        ["get", "point_count"],
        16,
        20,
        20,
        75,
        26,
      ],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.7,
    },
  };

  const clusterCountLayer: any = {
    id: "cluster-count",
    type: "symbol",
    source: "places",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
    },
    paint: {
      "text-color": "#ffffff",
    },
  };

  const unclusteredPointLayer: any = {
    id: "unclustered-point",
    type: "circle",
    source: "places",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": ["get", "color"],
      "circle-radius": 7,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.95,
    },
  };

  const muniFillLayer: any = {
    id: "muni-fill",
    type: "fill",
    source: "municipalities",
    paint: {
      "fill-color": "#2563EB",
      "fill-opacity": 0.06,
    },
  };
  
  const muniLineLayer: any = {
    id: "muni-line",
    type: "line",
    source: "municipalities",
    paint: {
      "line-color": "#2563EB",
      "line-opacity": 0.55,
      "line-width": 1,
    },
  };
  


  const activePlace = useMemo(() => {
    if (!activePlaceId) return null;
    return places.find((p) => placeKey(p) === activePlaceId) || null;
  }, [activePlaceId, places]);

  useEffect(() => {
    if (viewMode !== "map") return;
    if (!activePlaceId) return;
    if (!activePlace) return;

    const lng = safeNum(activePlace.lng);
    const lat = safeNum(activePlace.lat);
    if (lng === null || lat === null) return;

    // Wait for the popup DOM to render, then check if it's clipped by the map container.
    let raf2: number | null = null;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        const map = mapRef.current;
        if (!map) return;

        const container = map.getContainer();
        if (!container) return;

        const popupEl = document.querySelector(
          ".arrival-popup.mapboxgl-popup"
        ) as HTMLElement | null;
        if (!popupEl) return;

        const pad = 12;
        const cRect = container.getBoundingClientRect();
        const pRect = popupEl.getBoundingClientRect();

        let dx = 0;
        let dy = 0;

        // If popup is outside container bounds, compute how many pixels it needs to move.
        if (pRect.left < cRect.left + pad) dx = (cRect.left + pad) - pRect.left;
        if (pRect.right > cRect.right - pad) dx = (cRect.right - pad) - pRect.right;
        if (pRect.top < cRect.top + pad) dy = (cRect.top + pad) - pRect.top;
        if (pRect.bottom > cRect.bottom - pad) dy = (cRect.bottom - pad) - pRect.bottom;

        // Guardrail: avoid huge pans if rects are temporarily inconsistent (e.g., images loading).
        const clamp = (v: number, lim = 240) => Math.max(-lim, Math.min(lim, v));
        dx = clamp(dx);
        dy = clamp(dy);

        // `panBy` direction is inverted relative to our DOM-rect correction on both axes.
        // Flip X and Y so the popup moves back into the visible map container.
        if (dx !== 0 || dy !== 0) {
          try {
            map.panBy([-dx, -dy], { duration: 350 });
          } catch {
            // ignore
          }
        }
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      if (raf2 !== null) window.cancelAnimationFrame(raf2);
    };
  }, [activePlaceId, activePlace, viewMode]);



  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]
    );
  }

  function focusPlace(p: Place) {
    const lat = safeNum(p.lat);
    const lng = safeNum(p.lng);
    if (lat === null || lng === null) {
      setActivePlaceId(placeKey(p));
      return;
    }
    const pid = placeKey(p);
    setActivePlaceId(pid);
    // Fly the map to the selected place.
    try {
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: Math.max(12, mapRef.current?.getZoom() || 10),
        duration: 900,
      });
    } catch {
      // ignore
    }
  }

  function formatHours(hours: string | null): string | null {
    const h = (hours || "").toString().trim();
    if (!h) return null;
    // Keep it compact; the API often returns long strings.
    return h.replace(/\s*\|\s*/g, " • ");
  }

  return (
    <div style={{ 
      width: "100%",
      maxWidth: "100%",
      padding: "12px 8px 24px",
      marginLeft: "-8px",
      marginRight: "-8px"
    }}>
      <main style={{ display: "grid", gap: 16, width: "100%" }}>
      <header style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, margin: 0 }}>Resources for Arrival</h1>
          {isMobile && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-full"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <p style={{ opacity: 0.8, margin: 0, fontSize: isMobile ? 13 : 14 }}>
          {loading
  ? "Loading…"
  : viewMode === "map"
    ? `${placesInView.length} in view • ${places.length} total`
    : `${filteredUnique.length} filtered • ${places.length} total`}
          </p>

          <div
            style={{
              display: "flex",
              gap: 6,
              border: "1px solid var(--border)",
              borderRadius: 999,
              padding: 4,
              background: "var(--surface)",
            }}
            aria-label="View mode"
          >
            <Button
              type="button"
              variant={viewMode === "map" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("map")}
              className="rounded-full"
            >
              Map
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-full"
            >
              List
            </Button>
          </div>
        </div>
      </header>

      <section style={{ 
        display: "grid", 
        gridTemplateColumns: isMobile 
          ? "1fr" 
          : `${sidebarWidth}px 10px 1fr`, 
        gap: isMobile ? 12 : 16,
        gridTemplateRows: isMobile ? "auto 1fr" : "1fr"
      }}>
        {/* LEFT: filters + tags + counts + list */}
        <aside
        style={{
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 12,
            display: isMobile ? (sidebarOpen ? "grid" : "none") : "grid",
            gap: 14,
            alignContent: "start",
            height: isMobile 
              ? sidebarOpen 
                ? "auto" 
                : 0 
              : "calc(100vh - 210px)",
            maxHeight: isMobile ? "60vh" : "calc(100vh - 210px)",
            overflow: isMobile ? "auto" : "hidden",
            background: "var(--surface-2)",
            boxShadow: "var(--shadow-sm)",
            gridColumn: isMobile ? "1 / -1" : "1",
            gridRow: isMobile ? "1" : "1",
            transition: isMobile ? "max-height 0.3s ease, opacity 0.3s ease" : "none",
            opacity: isMobile && !sidebarOpen ? 0 : 1,
          }}
        >
          {/* Search */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Input
                className="flex-1 h-10 pr-8"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setQuery(queryInput);
                    setActivePlaceId(null);
                  }
                }}
                placeholder="Search by name…"
                style={{ background: "var(--surface)" }}
              />
              {queryInput && (
                <button
                  type="button"
                  onClick={clearNameSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="button"
              className="h-10"
              onClick={() => {
                setQuery(queryInput);
                setActivePlaceId(null);
              }}
              style={{ whiteSpace: "nowrap" }}
            >
              Search
            </Button>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Input
                  className="flex-1 h-10 pr-8"
                  value={nearQuery}
                  onChange={(e) => setNearQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") geocodeAndFly();
                  }}
                  placeholder="Search near you (address or ZIP)…"
                  style={{ background: "var(--surface)" }}
                />
                {nearQuery && (
                  <button
                    type="button"
                    onClick={clearNearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear search"
                    title="Clear search and reset map view"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                type="button"
                className="h-10"
                onClick={geocodeAndFly}
                disabled={nearLoading}
                title="Pan the map to your location"
                style={{ whiteSpace: "nowrap" }}
              >
                {nearLoading ? "Searching…" : "Near me"}
              </Button>
            </div>
            {nearError ? (
              <div style={{ fontSize: 12, color: "#b91c1c" }}>{nearError}</div>
            ) : null}
          </div>

          {/* Tags */}
          <div style={{ display: "grid", gap: 10, minHeight: 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontWeight: 700 }}>Service Tags</div>

                <div style={{ display: "grid", gap: 6, alignItems: "flex-start" }}>
                  {/* Tag meanings dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-xs underline underline-offset-4 text-primary hover:text-[var(--accent-strong)] cursor-pointer"
                        style={{ width: "fit-content", textAlign: "left" }}
                      >
                        What do these tags mean?
                      </button>
                    </DialogTrigger>

                    <DialogContent className="max-w-3xl overflow-hidden">
                      <DialogHeader className="pb-3">
                        <DialogTitle>Service Tags Guide</DialogTitle>
                        <DialogDescription>This explains what each tag means.</DialogDescription>
                      </DialogHeader>
                      <div className="max-h-[72vh] overflow-y-auto pr-1">
                        <div className="grid gap-3">
                          {tagGuide.map((t) => (
                            <div key={t.tag} className="rounded-lg border p-3">
                              <div className="font-semibold">
                                {t.display_name}{" "}
                                <span className="font-normal opacity-60 text-xs"></span>
                              </div>
                              {t.description ? <div className="mt-2 opacity-90">{t.description}</div> : null}
                              {t.example_keywords ? (
                                <div className="mt-2 text-sm opacity-80">
                                  <strong>Example keywords:</strong> {t.example_keywords}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Food help dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-xs underline underline-offset-4 text-primary hover:text-[var(--accent-strong)] cursor-pointer"
                        style={{ width: "fit-content", textAlign: "left" }}
                      >
                        Looking for food?
                      </button>
                    </DialogTrigger>

                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Looking for food?</DialogTitle>
                      </DialogHeader>
                      <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                        For food pantries, free meals, food deliveries, please visit the Greater Boston Food Bank to find resources near you:{" "}
                        <a href="https://www.gbfb.org/need-food/" target="_blank" rel="noreferrer">
                          https://www.gbfb.org/need-food/
                        </a>
                        .
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setSelectedTags([])}
                title="Clear selected tags"
              >
                Clear
              </Button>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 8,
                maxHeight: 360,
                overflow: "auto",
                paddingRight: 4,
              }}
            >
              {allTags.map((t) => {
                const active = selectedTags.includes(t);
                return (
                  <Button
                    key={t}
                    variant="outline"
                    size="sm"
                    aria-pressed={active}
                    className={`rounded-full h-8 px-3 ${
                      active
                        ? "border-primary/40 bg-primary/10 hover:bg-primary/15"
                        : "hover:bg-secondary"
                    }`}
                    onClick={() => toggleTag(t)}
                    title={tagMeta.get(t)?.description || ""}
                  >
                    {tagLabel.get(t) ?? t}
                  </Button>
                );
              })}
            </div>

            {selectedTags.length > 0 && (
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                Selected: {selectedTags.map((t) => tagLabel.get(t) ?? t).join(", ")}
              </div>
            )}
          </div>

          {/* Counts by category */}
          <div style={{ borderTop: "1px solid #eee", paddingTop: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Counts by Category</div>

            {countsByCategory.length === 0 ? (
              <div style={{ fontSize: 12, opacity: 0.7 }}>No places in view.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {(() => {
                  const max = Math.max(...countsByCategory.map(([, n]) => n));
                  return countsByCategory.map(([cat, n]) => {
                    const pct = max > 0 ? (n / max) * 100 : 0;
                    return (
                      <div key={cat} style={{ display: "grid", gap: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
                          <span style={{ opacity: 0.85 }}>{cat}</span>
                          <span style={{ fontWeight: 800 }}>{n}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              width: 18,
                              textAlign: "center",
                              fontSize: 14,
                              lineHeight: "14px",
                              opacity: 0.9,
                            }}
                            title={cat}
                            aria-label={cat}
                          >
                            {categoryIcon(cat)}
                          </span>

                          <div
                            style={{
                              flex: 1,
                              height: 8,
                              background: "#f3f4f6",
                              borderRadius: 999,
                              overflow: "hidden",
                              border: "1px solid #eee",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                background: categoryColor(cat),
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

        </aside>

        {/* Resizer - hidden on mobile */}
        {!isMobile && (
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              try {
                (e.currentTarget as any).setPointerCapture?.(e.pointerId);
              } catch {}
              resizeState.current.dragging = true;
              resizeState.current.startX = e.clientX;
              resizeState.current.startWidth = sidebarWidth;
            }}
            style={{
              height: "calc(100vh - 210px)",
              borderRadius: 999,
              cursor: "col-resize",
              display: "grid",
              placeItems: "center",
              userSelect: "none",
              touchAction: "none",
            }}
            title="Drag to resize sidebar"
            aria-label="Resize sidebar"
          >
            <div
              style={{
                width: 4,
                height: "100%",
                borderRadius: 999,
                background: "#e5e7eb",
              }}
            />
          </div>
        )}

        {/* RIGHT: map */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            height: isMobile 
              ? "calc(100dvh - 280px)" 
              : "calc(100vh - 210px)",
            minHeight: isMobile ? 400 : undefined,
            position: "relative",
            background: "var(--surface)",
            boxShadow: "var(--shadow-sm)",
            gridColumn: isMobile ? "1 / -1" : "3",
            gridRow: isMobile ? "2" : "1",
            width: "100%",
          }}
        >
          {viewMode === "map" ? (
            !hasMapboxToken ? (
              <div style={{ padding: 16 }}>
                <div style={{ fontWeight: 800 }}>Mapbox token missing</div>
                <div style={{ marginTop: 6, opacity: 0.8, fontSize: 13 }}>
                  Set <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> in <code>arrival-resources-web/.env.local</code> and restart <code>npm run dev</code>.
                </div>
              </div>
            ) : (
              <MapGL
                ref={(r: MapRef | null) => {
                  mapRef.current = r;
                }}
                mapboxAccessToken={mapboxToken}
                initialViewState={{
                  longitude: -71.0589,
                  latitude: 42.3601,
                  zoom: 9.5,
                }}
                onLoad={() => {
                  try {
                    const b = mapRef.current?.getBounds();
                    if (!b) return;
                    setMapBounds({
                      west: b.getWest(),
                      south: b.getSouth(),
                      east: b.getEast(),
                      north: b.getNorth(),
                    });
                  } catch {}
                }}
                onMoveEnd={() => {
                  try {
                    const b = mapRef.current?.getBounds();
                    if (!b) return;
                    setMapBounds({
                      west: b.getWest(),
                      south: b.getSouth(),
                      east: b.getEast(),
                      north: b.getNorth(),
                    });
                  } catch {}
                }}
                onZoomEnd={() => {
                  try {
                    const b = mapRef.current?.getBounds();
                    if (!b) return;
                    setMapBounds({
                      west: b.getWest(),
                      south: b.getSouth(),
                      east: b.getEast(),
                      north: b.getNorth(),
                    });
                  } catch {}
                }}
                mapStyle="mapbox://styles/mapbox/light-v11"
                style={{ width: "100%", height: "100%", touchAction: "pan-x pan-y pinch-zoom" }}
                interactiveLayerIds={["clusters", "unclustered-point"]}
                onClick={(e) => {
                  const f = e.features?.[0];
                  if (!f) return;

                  const props: any = f.properties || {};

                  // If a cluster was clicked, zoom into it.
                  if (props.cluster) {
                    const clusterId = Number(props.cluster_id);
                    const map = mapRef.current?.getMap();
                    const src: any = map?.getSource("places");
                    if (!src || !Number.isFinite(clusterId)) return;

                    src.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
                      if (err) return;
                      const coords = (f.geometry as any)?.coordinates as [number, number] | undefined;
                      if (!coords) return;
                      mapRef.current?.easeTo({
                        center: coords,
                        zoom: Math.min(zoom, 16),
                        duration: 450,
                      });
                    });
                    return;
                  }

                  // If an individual point was clicked, open its popup.
                  if (props.pid) {
                    setActivePlaceId(String(props.pid));
                  }
                }}
              >
                {/* On mobile, only show container when expanded; on desktop, always show container */}
                {(isMobile ? legendOpen : true) && (
                  <div
                    style={{
                      position: "absolute",
                      top: isMobile ? 8 : 12,
                      right: isMobile ? 8 : 12,
                      left: isMobile ? 8 : undefined,
                      bottom: isMobile ? 8 : undefined,
                      zIndex: 2,
                      background: "rgba(255,255,255,0.92)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: isMobile ? 8 : 10,
                      width: isMobile ? "calc(100% - 16px)" : 220,
                      maxWidth: isMobile ? 280 : 220,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setLegendOpen(!legendOpen)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        background: "none",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        cursor: "pointer",
                        fontWeight: 800,
                        fontSize: isMobile ? 12 : 13,
                        marginBottom: legendOpen ? (isMobile ? 6 : 8) : 0,
                        color: "inherit",
                      }}
                      aria-label={legendOpen ? "Collapse legend" : "Expand legend"}
                      aria-expanded={legendOpen}
                    >
                      <span>Legend</span>
                      {legendOpen ? (
                        <ChevronUp className="h-4 w-4" style={{ opacity: 0.7 }} />
                      ) : (
                        <ChevronDown className="h-4 w-4" style={{ opacity: 0.7 }} />
                      )}
                    </button>
                    {legendOpen && (
                      <>
                        <div style={{ display: "grid", gap: isMobile ? 4 : 6, fontSize: isMobile ? 11 : 12 }}>
                          {[
                            { label: "Public Library", color: categoryColor("library") },
                            { label: "Food Access", color: categoryColor("food_access") },
                            { label: "Government Office", color: categoryColor("government") },
                            { label: "Education Center", color: categoryColor("education") },
                            { label: "Community Organization", color: categoryColor("community") },
                          ].map((it) => (
                            <div key={it.label} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <span
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 999,
                                  background: it.color,
                                  border: "1px solid rgba(0,0,0,0.08)",
                                }}
                              />
                              <span style={{ opacity: 0.9 }}>{it.label}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "10px 0" }} />
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 12,
                            cursor: "pointer",
                            userSelect: "none",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={showMunicipalities}
                            onChange={(e) => setShowMunicipalities(e.target.checked)}
                            style={{ width: 14, height: 14 }}
                          />
                          <span style={{ opacity: 0.9 }}>Municipal Boundaries</span>
                        </label>
                      </>
                    )}
                  </div>
                )}
                {/* On mobile, show a small toggle button when collapsed */}
                {isMobile && !legendOpen && (
                  <button
                    type="button"
                    onClick={() => setLegendOpen(true)}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      zIndex: 2,
                      background: "rgba(255,255,255,0.92)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontWeight: 800,
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: "inherit",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                    aria-label="Expand legend"
                    aria-expanded={false}
                  >
                    <span>Legend</span>
                    <ChevronDown className="h-4 w-4" style={{ opacity: 0.7 }} />
                  </button>
                )}
                {showMunicipalities ? (
                    <Source id="municipalities" type="geojson" data="/gb_municipalities.geojson">
                        <Layer {...muniFillLayer} />
                        <Layer {...muniLineLayer} />
                    </Source>
                    ) : null}
                <Source
                  id="places"
                  type="geojson"
                  data={placesGeoJSON as any}
                  cluster
                  clusterMaxZoom={10}
                  clusterRadius={28}
                  clusterMinPoints={3}
                >
                  <Layer {...clusterLayer} />
                  <Layer {...clusterCountLayer} />
                  <Layer {...unclusteredPointLayer} />
                </Source>

                {activePlace &&
                safeNum(activePlace.lat) !== null &&
                safeNum(activePlace.lng) !== null ? (
                  <Popup
                    longitude={safeNum(activePlace.lng) as number}
                    latitude={safeNum(activePlace.lat) as number}
                    anchor="top"
                    onClose={() => setActivePlaceId(null)}
                    closeButton
                    closeOnClick={false}
                    maxWidth={isMobile ? "calc(100vw - 32px)" : "340px"}
                    className="arrival-popup"
                  >
                    <div style={{ display: "grid", gap: 8 }}>
                      {getPhotoSrc(activePlace.photo_ref, activePlace.place_id) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getPhotoSrc(activePlace.photo_ref, activePlace.place_id) as string}
                          alt="Place photo"
                          style={{
                            width: "100%",
                            height: 140,
                            objectFit: "cover",
                            borderRadius: 10,
                          }}
                        />
                      ) : null}

                      <div style={{ fontWeight: 800, fontSize: 14 }}>
                        {activePlace.office || activePlace.organization || "(No name)"}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>{activePlace.organization}</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{activePlace.address}</div>

                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          flexWrap: "wrap",
                          marginTop: 4,
                          alignItems: "center",
                        }}
                      >
                        {activePlace.phone ? (
                          <a
                            href={`tel:${activePlace.phone}`}
                            title="Call"
                            className="text-xs underline underline-offset-4 text-foreground/80 hover:text-primary"
                          >
                            📞 {activePlace.phone}
                          </a>
                        ) : null}

                        {activePlace.email ? (
                          <a
                            href={`mailto:${activePlace.email}`}
                            title={activePlace.email}
                            className="text-xs underline underline-offset-4 text-foreground/80 hover:text-primary"
                          >
                            Email
                          </a>
                        ) : null}

                        {safeUrl(activePlace.website) ? (
                          <a
                            href={safeUrl(activePlace.website) as string}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs underline underline-offset-4 text-foreground/80 hover:text-primary"
                          >
                            Website
                          </a>
                        ) : null}

                        {safeUrl(activePlace.maps_url) ? (
                          <a
                            href={safeUrl(activePlace.maps_url) as string}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs underline underline-offset-4 text-foreground/80 hover:text-primary"
                          >
                            Google Maps
                          </a>
                        ) : null}
                      </div>

                      {activePlace.service_tags?.length ? (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                            marginTop: 6,
                          }}
                        >
                          {activePlace.service_tags.slice(0, 10).map((t) => (
                            <span
                              key={t}
                              style={{
                                fontSize: 12,
                                border: "1px solid #ddd",
                                borderRadius: 999,
                                padding: "2px 8px",
                              }}
                              title={tagMeta.get(t)?.description || ""}
                            >
                              {tagLabel.get(t) ?? t}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </Popup>
                ) : null}
              </MapGL>
            )
          ) : (
            <div style={{ height: "100%", overflow: "auto", padding: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Results</div>
              <div style={{ display: "grid", gap: 12 }}>
                {filteredUnique.map((p) => {
                  const pid = placeKey(p);
                  const isActive = !!activePlaceId && pid === activePlaceId;
                  const photo = getPhotoSrc(p.photo_ref, p.place_id);
                  const hours = formatHours(p.opening_hours);

                  return (
                    <div
                      key={pid}
                      style={{
                        border: "1px solid #eee",
                        borderRadius: 14,
                        padding: 12,
                        background: isActive ? "#f3f4f6" : "white",
                      }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: photo ? "120px 1fr" : "1fr", gap: 12 }}>
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photo}
                            alt="Place photo"
                            style={{ width: 120, height: 120, borderRadius: 12, objectFit: "cover", border: "1px solid #eee" }}
                          />
                        ) : null}

                        <div style={{ display: "grid", gap: 6 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span
                              style={{ width: 10, height: 10, borderRadius: 999, background: categoryColor(p.category) }}
                            />
                            <div style={{ fontWeight: 900, fontSize: 15 }}>
                              {p.office || p.organization || "(No name)"}
                            </div>
                          </div>
                          {p.organization ? <div style={{ opacity: 0.8 }}>{p.organization}</div> : null}
                          {p.address ? <div style={{ opacity: 0.7 }}>{p.address}</div> : null}

                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 2, alignItems: "center" }}>
                            {p.phone ? (
                              <a
                                href={`tel:${p.phone}`}
                                title="Call"
                                className="text-sm underline underline-offset-4 text-foreground/80 hover:text-primary"
                              >
                                📞 {p.phone}
                              </a>
                            ) : null}
                            {p.email ? (
                              <a
                                href={`mailto:${p.email}`}
                                title={p.email}
                                className="text-sm underline underline-offset-4 text-foreground/80 hover:text-primary"
                              >
                                Email
                              </a>
                            ) : null}
                            {safeUrl(p.website) ? (
                              <a
                                href={safeUrl(p.website) as string}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm underline underline-offset-4 text-foreground/80 hover:text-primary"
                              >
                                Website
                              </a>
                            ) : null}
                            {safeUrl(p.maps_url) ? (
                              <a
                                href={safeUrl(p.maps_url) as string}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm underline underline-offset-4 text-foreground/80 hover:text-primary"
                              >
                                Google Maps
                              </a>
                            ) : null}
                          </div>

                          {hours ? (
                            <div style={{ fontSize: 13, opacity: 0.8 }}>
                              <strong>Hours:</strong> {hours}
                            </div>
                          ) : null}

                          {p.service_tags?.length ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                              {p.service_tags.map((t) => (
                                <span
                                  key={t}
                                  style={{ fontSize: 12, border: "1px solid #ddd", borderRadius: 999, padding: "2px 8px" }}
                                  title={tagMeta.get(t)?.description || ""}
                                >
                                  {tagLabel.get(t) ?? t}
                                </span>
                              ))}
                            </div>
                          ) : null}

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Map popup close button style */}
      <style jsx global>{`
        .arrival-popup .mapboxgl-popup-content {
          border-radius: 14px;
          overflow: hidden;
          background: var(--surface);
          color: var(--text);
          box-shadow: var(--shadow-md);
          touch-action: manipulation;
        }

        .arrival-popup .mapboxgl-popup-content a {
          color: var(--primary);
          text-decoration: underline;
          text-underline-offset: 3px;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
        }

        .arrival-popup .mapboxgl-popup-content a:hover {
          color: var(--accent-strong);
        }

        .arrival-popup .mapboxgl-popup-close-button {
          top: 14px;
          right: 14px;
          width: 44px;
          height: 44px;
          min-width: 44px;
          min-height: 44px;
          font-size: 22px;
          line-height: 1;
          padding: 0 0 2px 0; /* nudge the × up a touch */
          border-radius: 10px;
          border: 3px solid var(--primary);
          background: var(--surface);
          color: var(--foreground);
          box-shadow: none;
          opacity: 0.95;
          display: flex;
          align-items: center;
          justify-content: center;
          touch-action: manipulation;
          cursor: pointer;
        }

        .arrival-popup .mapboxgl-popup-close-button:hover {
          background: var(--primary-soft-10);
          opacity: 1;
        }

        .arrival-popup .mapboxgl-popup-close-button:active {
          background: var(--primary-soft-16);
          transform: scale(0.95);
        }

        .arrival-popup .mapboxgl-popup-close-button:focus-visible {
          outline: 2px solid var(--ring);
          outline-offset: 2px;
        }

        @media (max-width: 768px) {
          .arrival-popup .mapboxgl-popup-close-button {
            width: 48px;
            height: 48px;
            min-width: 48px;
            min-height: 48px;
            top: 8px;
            right: 8px;
          }
        }
      `}</style>
      </main>
    </div>
  );
}