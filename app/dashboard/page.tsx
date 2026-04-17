"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MapGL, { Layer, Popup, Source, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  Menu,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Map as MapIcon,
  LayoutList,
  Globe,
  MapPinned,
  Phone,
  Mail,
} from "lucide-react";
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
  directions_url: string | null;
  photo_ref: string | null;
  service_tags: string[];
};

type TagGuide = {
  tag: string;
  display_name: string;
  description?: string;
  example_keywords?: string;
};

type SearchMode = "none" | "organization" | "location";
type TagGroupDef = {
  id: string;
  label: string;
  description: string;
  tags: string[];
};
type AdditionalResourceGroup = {
  id: string;
  label: string;
  links: Array<{ label: string; href: string }>;
};

const PLACEHOLDER_IMAGE = "/placeholder-image.jpg";
const SERVICE_TAG_GROUPS: TagGroupDef[] = [
  {
    id: "daily-needs",
    label: "Daily Needs",
    description: "Food, basic goods, housing stability, and essential support.",
    tags: [
      "food_access",
      "material_assistance",
      "housing_support",
      "shelter",
      "benefits_navigation",
      "cash_assistance",
      "utility_assistance",
      "transportation",
    ],
  },
  {
    id: "legal-civic",
    label: "Legal, Immigration, and Civic Support",
    description: "Documentation, immigration help, and civic participation.",
    tags: [
      "immigration_legal",
      "citizenship",
      "id_documents",
      "translation",
      "notary_services",
      "passport_services",
      "immigrant_advocacy",
      "civic_engagement",
    ],
  },
  {
    id: "education-language",
    label: "Education and English",
    description: "English learning, ESOL, and continuing education.",
    tags: [
      "esol",
      "adult_education",
    ],
  },
  {
    id: "work-income",
    label: "Work and Income",
    description: "Job readiness, training, and small-business support.",
    tags: [
      "career_services",
      "job_training",
      "financial_literacy",
      "entrepreneur_support",
    ],
  },
  {
    id: "health-wellbeing",
    label: "Health and Wellbeing",
    description: "Medical care, mental health, and wellness support.",
    tags: [
      "health_clinic",
      "mental_health",
      "public_health_programs",
    ],
  },
  {
    id: "children-family",
    label: "Children, Youth, Family, and Elderly",
    description: "Support for children, young people, parents, and older adults.",
    tags: [
      "childcare_early_childhood",
      "youth_programs",
      "after_school_program",
      "family_program",
      "school_support",
      "elderly_support",
    ],
  },
  {
    id: "tech-library",
    label: "Technology and Library Resources",
    description: "Digital access, library services, space, and equipment.",
    tags: [
      "digital_skills",
      "internet_access",
      "public_computers",
      "printing_scanning",
      "library_services",
      "makerspace",
      "library_of_things",
      "meeting_room_reservation",
      "study_room_reservation",
      "seed_library",
    ],
  },
  {
    id: "community-culture",
    label: "Community and Culture",
    description: "Community connection, mutual support, and cultural activities.",
    tags: [
      "mutual_aid",
      "arts_culture",
      "sports_recreation",
    ],
  },
  {
    id: "support-services",
    label: "Support Services",
    description: "Individual case management.",
    tags: [
      "case_management",
    ],
  },

];
const ADDITIONAL_RESOURCE_GROUPS: AdditionalResourceGroup[] = [
  {
    id: "comprehensive",
    label: "Comprehensive",
    links: [
      {
        label: "MIRA Resources and Factsheets",
        href: "https://miracoalition.org/news/category/resources/",
      },
      {
        label: "Massachusetts ORI Toolkit",
        href: "https://www.mass.gov/community-resource-toolkit",
      },
      {
        label: "Boston City Services and Benefits",
        href: "https://www.boston.gov/departments/immigrant-advancement/city-services-and-benefits",
      },
    ],
  },
  {
    id: "legal",
    label: "Immigration Legal",
    links: [
      {
        label: "MIRA Legal Services",
        href: "https://www.miracoalition.org/resources/legal-services/",
      },
      {
        label: "National Legal Services Directory",
        href: "https://www.immigrationadvocates.org/nonprofit/legaldirectory/",
      },
      {
        label: "Massachusetts AG Immigrant Resources",
        href: "https://www.mass.gov/info-details/resources-for-immigrants-in-massachusetts",
      },
      {
        label: "Boston Free Immigration Consultations",
        href: "https://www.boston.gov/departments/immigrant-advancement/free-immigration-consultations",
      },
    ],
  },
  {
    id: "food",
    label: "Food",
    links: [
      {
        label: "Greater Boston Food Bank",
        href: "https://www.gbfb.org/need-food/",
      },
    ],
  },
];

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

  return PLACEHOLDER_IMAGE;
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

  // Health centers / clinics
  if (c.includes("health")) return "#fb8500"; // orange

  // Community centers should be visually distinct from broader community organizations
  if (c.includes("community_center")) return "#ffd60a"; // yellow

  // Religious / faith-based resources
  if (
    c.includes("religious") ||
    c.includes("faith") ||
    c.includes("church") ||
    c.includes("mosque") ||
    c.includes("temple") ||
    c.includes("synagogue")
  )
    return "#7C3AED"; // purple

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

  if (c.includes("health")) return "🏥";
  if (c.includes("community_center")) return "🏠";

  if (
    c.includes("religious") ||
    c.includes("faith") ||
    c.includes("church") ||
    c.includes("mosque") ||
    c.includes("temple") ||
    c.includes("synagogue")
  )
    return "⛪";

  if (c.includes("community") || c.includes("nonprofit") || c.includes("organization")) return "🤝";

  return "📍";
}

function safeNum(n: any): number | null {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : null;
}

function looksLikeZipCode(input: string): boolean {
  return /^\d{5}(?:-\d{4})?$/.test(input.trim());
}

function looksLikeAddress(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;

  if (looksLikeZipCode(trimmed)) return true;

  const lower = trimmed.toLowerCase();
  const hasStreetNumber = /\d+/.test(trimmed);
  const hasStreetWord =
    /\b(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|ct|court|pl|place|way|sq|square|cir|circle|pkwy|parkway|hwy|highway)\b/i.test(
      trimmed
    );
  const hasCityStatePattern = /,\s*[a-z .'-]+,\s*[a-z]{2}\b/i.test(lower);
  const hasStateSuffix = /\b(ma|massachusetts)\b/i.test(trimmed);

  return (hasStreetNumber && (hasStreetWord || trimmed.includes(","))) || hasCityStatePattern || hasStateSuffix;
}

function buildDefaultExpandedGroups() {
  return Object.fromEntries(
    SERVICE_TAG_GROUPS.map((group, index) => [group.id, index === 0])
  );
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

function offsetCoordinates(lng: number, lat: number, angleDeg: number, distanceMeters: number) {
  const radians = (angleDeg * Math.PI) / 180;
  const latOffset = (distanceMeters * Math.sin(radians)) / 111_320;
  const lngOffset =
    (distanceMeters * Math.cos(radians)) /
    (111_320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));

  return {
    lng: lng + lngOffset,
    lat: lat + latOffset,
  };
}

export default function DashboardPage() {
  const isMobile = useIsMobile();
  const desktopPanelHeight = "calc(100vh - 210px)";
  const [places, setPlaces] = useState<Place[]>([]);
  const [tagGuide, setTagGuide] = useState<TagGuide[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("none");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [expandedTagGroups, setExpandedTagGroups] = useState<Record<string, boolean>>(
    () => buildDefaultExpandedGroups()
  );
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestHighlight, setSuggestHighlight] = useState(-1);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [showMunicipalities, setShowMunicipalities] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(!isMobile);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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
  const [nearError, setNearError] = useState<string | null>(null);
  const [searchGeocoding, setSearchGeocoding] = useState(false);
  const [nearMeLoading, setNearMeLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(9.5);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
  const hasMapboxToken = mapboxToken.trim().length > 0;

  function moveMapToGeocodeFeature(feat: {
    center: number[];
    bbox?: number[];
    place_type?: string[];
  }) {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const pt = feat.place_type || [];
    const isAddr = pt.includes("address");
    const isPc = pt.includes("postcode");

    if (feat.bbox && feat.bbox.length >= 4) {
      const [w, s, e, n] = feat.bbox;
      const maxZoom = isAddr ? 16 : isPc ? 14.5 : 13;
      const pad = isAddr ? 72 : isPc ? 56 : 48;
      try {
        map.fitBounds(
          [
            [w, s],
            [e, n],
          ],
          { padding: pad, duration: 900, maxZoom }
        );
      } catch {
        const [lng, lat] = feat.center;
        map.flyTo({ center: [lng, lat], zoom: isAddr ? 15.5 : isPc ? 13.2 : 11.5, duration: 900 });
      }
      return;
    }

    const [lng, lat] = feat.center;
    const zoomGuess = isAddr
      ? 15.5
      : isPc
        ? 13.2
        : pt.includes("neighborhood")
          ? 12.8
          : pt.includes("locality")
            ? 11.8
            : pt.includes("place")
              ? 10.2
              : 11.5;
    map.flyTo({ center: [lng, lat], zoom: zoomGuess, duration: 900 });
  }

  function shouldMoveMapToGeocodeFeature(feat: {
    relevance?: number;
    place_type?: string[];
  }): boolean {
    const rel = typeof feat.relevance === "number" ? feat.relevance : 0;
    const pt = feat.place_type || [];
    if (pt.includes("postcode") || pt.includes("address")) return rel >= 0.45;
    if (pt.some((t) => ["neighborhood", "locality", "district", "place"].includes(t)))
      return rel >= 0.72;
    return rel >= 0.88;
  }

  async function tryGeocodeForSearch(trimmed: string): Promise<boolean> {
    if (!trimmed || !hasMapboxToken) return false;

    setSearchGeocoding(true);
    setNearError(null);

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json?access_token=${encodeURIComponent(
        mapboxToken
      )}&autocomplete=true&limit=1&types=address,postcode,place,locality,neighborhood`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
      const data = (await res.json()) as {
        features?: Array<{
          center?: number[];
          bbox?: number[];
          place_type?: string[];
          relevance?: number;
        }>;
      };
      const feat = data?.features?.[0];
      const center = feat?.center;
      if (!feat || !Array.isArray(center) || center.length < 2) {
        setNearError("No map location found for that ZIP code or address.");
        return false;
      }

      if (shouldMoveMapToGeocodeFeature(feat)) {
        moveMapToGeocodeFeature({
          center: center as number[],
          bbox: feat.bbox,
          place_type: feat.place_type,
        });
        return true;
      }
      setNearError("No map location found for that ZIP code or address.");
      return false;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Geocoding failed";
      setNearError(msg);
      return false;
    } finally {
      setSearchGeocoding(false);
    }
  }

  async function submitUnifiedSearch() {
    const trimmed = searchInput.trim();
    setSuggestOpen(false);
    setSuggestHighlight(-1);
    setActivePlaceId(null);
    setNearError(null);

    if (!trimmed) {
      setQuery("");
      setSearchMode("none");
      return;
    }

    const isLocationSearch = looksLikeZipCode(trimmed) || looksLikeAddress(trimmed);
    if (isLocationSearch) {
      if (!hasMapboxToken) {
        setSearchMode("location");
        setQuery("");
        setNearError("Mapbox token missing. Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local and restart.");
        return;
      }

      const moved = await tryGeocodeForSearch(trimmed);
      if (moved) {
        setQuery("");
        setSearchMode("location");
      }
      else {
        setQuery("");
        setSearchMode("location");
      }
      return;
    }

    setQuery(trimmed);
    setSearchMode("organization");
  }

  function clearUnifiedSearch() {
    setSearchInput("");
    setQuery("");
    setSearchMode("none");
    setNearError(null);
    setSuggestOpen(false);
    setSuggestHighlight(-1);
    setActivePlaceId(null);
    mapRef.current?.flyTo({
      center: [-71.0589, 42.3601],
      zoom: 9.5,
      duration: 900,
    });
  }

  function requestUserNearMe() {
    if (!hasMapboxToken) {
      setNearError("Mapbox token missing. Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local and restart.");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setNearError("Location is not available in this browser.");
      return;
    }
    setNearMeLoading(true);
    setNearError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          mapRef.current?.flyTo({
            center: [longitude, latitude],
            zoom: 13.2,
            duration: 900,
          });
        } catch {
          // ignore
        }
        setNearMeLoading(false);
      },
      (err) => {
        setNearMeLoading(false);
        setNearError(err.message || "Could not get your location.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 }
    );
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

  const placeAutocompleteSuggestions = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (q.length < 2) return [] as Place[];

    type Scored = { p: Place; score: number };
    const scored: Scored[] = [];

    for (const p of places) {
      const org = (
        (p as { organization?: string; organisation?: string }).organization ??
        (p as { organisation?: string }).organisation ??
        ""
      )
        .toString()
        .trim();
      const office = (p.office || "").toString().trim();
      const hay = `${org} ${office}`.toLowerCase();
      const orgLower = org.toLowerCase();
      const officeLower = office.toLowerCase();

      let score = 0;
      const primary = orgLower || officeLower;
      if (!primary) continue;

      if (orgLower.startsWith(q)) score += 120;
      else if (officeLower.startsWith(q)) score += 110;
      else if (primary.startsWith(q)) score += 100;
      else if (orgLower.includes(q)) score += 70;
      else if (officeLower.includes(q)) score += 65;
      else if (hay.includes(q)) score += 40;

      if (score > 0) scored.push({ p, score });
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ao = (a.p.organization || "").toLowerCase();
      const bo = (b.p.organization || "").toLowerCase();
      return ao.localeCompare(bo);
    });

    const seen = new Set<string>();
    const out: Place[] = [];
    for (const { p } of scored) {
      const k = placeKey(p);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(p);
      if (out.length >= 8) break;
    }
    return out;
  }, [searchInput, places]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const el = searchWrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setSuggestOpen(false);
        setSuggestHighlight(-1);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const filteredBySearch = useMemo(() => {
    const q = query.trim().toLowerCase();

    return places.filter((p) => {
      const org = ((p as any).organization ?? (p as any).organisation ?? "").toString();
      const office = (p.office ?? "").toString();
      const hay = `${org} ${office}`.toLowerCase();
      return searchMode !== "organization" || !q || hay.includes(q);
    });
  }, [places, query, searchMode]);

  const filtered = useMemo(() => {
    return filteredBySearch.filter((p) => {
      const matchTags =
        selectedTags.length === 0 ||
        selectedTags.some((t) => (p.service_tags || []).includes(t));
      const matchCategories =
        selectedCategories.length === 0 ||
        selectedCategories.includes((p.category || "Uncategorized").toString());

      return matchTags && matchCategories;
    });
  }, [filteredBySearch, selectedCategories, selectedTags]);

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

  const searchScopedPlacesInView = useMemo(() => {
    if (viewMode !== "map" || !mapBounds) return filteredBySearch;

    const { west, south, east, north } = mapBounds;

    return filteredBySearch.filter((p) => {
      const lat = safeNum(p.lat);
      const lng = safeNum(p.lng);
      if (lat === null || lng === null) return false;
      return lng >= west && lng <= east && lat >= south && lat <= north;
    });
  }, [filteredBySearch, mapBounds, viewMode]);

  // Pagination logic for list view
  const totalPages = useMemo(() => {
    return Math.ceil(filteredUnique.length / itemsPerPage);
  }, [filteredUnique.length]);

  const paginatedResults = useMemo(() => {
    return filteredUnique.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredUnique, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, searchMode, selectedCategories, selectedTags, viewMode]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of searchScopedPlacesInView) for (const t of p.service_tags || []) set.add(t);
    for (const t of selectedTags) set.add(t);
    return Array.from(set).sort((a, b) => {
      const la = (tagLabel.get(a) ?? a).toLowerCase();
      const lb = (tagLabel.get(b) ?? b).toLowerCase();
      return la.localeCompare(lb);
    });
  }, [searchScopedPlacesInView, selectedTags, tagLabel]);

  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of searchScopedPlacesInView) {
      const key = (p.category || "Uncategorized").toString() || "Uncategorized";
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    for (const category of selectedCategories) {
      if (!counts.has(category)) counts.set(category, 0);
    }

    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.label.localeCompare(b.label);
      });
  }, [searchScopedPlacesInView, selectedCategories]);

  const groupedTagSections = useMemo(() => {
    const visibleTags = new Set(allTags);
    const assigned = new Set<string>();
    const sections: Array<TagGroupDef & { visibleTags: string[] }> = [];

    for (const group of SERVICE_TAG_GROUPS) {
      const visible = group.tags.filter((tag) => visibleTags.has(tag));
      visible.forEach((tag) => assigned.add(tag));
      if (visible.length > 0) {
        sections.push({ ...group, visibleTags: visible });
      }
    }

    const remaining = allTags.filter((tag) => !assigned.has(tag));
    if (remaining.length > 0) {
      sections.push({
        id: "other-services",
        label: "Other Services",
        description: "Additional support areas available in the current results.",
        tags: remaining,
        visibleTags: remaining,
      });
    }

    return sections;
  }, [allTags]);

  // --- Mapbox clustering setup ---
  const placesGeoJSON = useMemo(() => {
    const zoomForOffsets = currentZoom;
    const shouldOffsetOverlaps = zoomForOffsets >= 13.5;
    const displayPlaces = filteredUnique
      .filter((p) => safeNum(p.lat) !== null && safeNum(p.lng) !== null)
      .slice()
      .sort((a, b) => placeKey(a).localeCompare(placeKey(b)));

    const overlapGroups = new Map<string, Place[]>();
    for (const p of displayPlaces) {
      const lat = safeNum(p.lat) as number;
      const lng = safeNum(p.lng) as number;
      const key = `${lat.toFixed(4)}:${lng.toFixed(4)}`;
      const group = overlapGroups.get(key) || [];
      group.push(p);
      overlapGroups.set(key, group);
    }

    return {
      type: "FeatureCollection" as const,
      features: displayPlaces.map((p) => {
          const lat = safeNum(p.lat) as number;
          const lng = safeNum(p.lng) as number;
          const pid = placeKey(p);
          const overlapKey = `${lat.toFixed(4)}:${lng.toFixed(4)}`;
          const group = overlapGroups.get(overlapKey) || [p];
          const index = group.findIndex((candidate) => placeKey(candidate) === pid);
          const overlapCount = group.length;
          const shouldApplyOffset = shouldOffsetOverlaps && overlapCount > 1 && index >= 0;
          const ringIndex = index < 0 ? 0 : index;
          const angle = overlapCount <= 1 ? 0 : (360 / overlapCount) * ringIndex;
          const distanceMeters = overlapCount <= 6 ? 14 : 18 + Math.floor(ringIndex / 6) * 6;
          const adjusted = shouldApplyOffset
            ? offsetCoordinates(lng, lat, angle, distanceMeters)
            : { lng, lat };

          return {
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [adjusted.lng, adjusted.lat] as [number, number],
            },
            properties: {
              pid,
              category: p.category || "",
              color: categoryColor(p.category || ""),
              trueLng: lng,
              trueLat: lat,
              overlapCount,
            },
          };
        }),
    };
  }, [currentZoom, filteredUnique]);

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

  const unclusteredHitAreaLayer: any = {
    id: "unclustered-hit-area",
    type: "circle",
    source: "places",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "#000000",
      "circle-radius": 16,
      "circle-opacity": 0.01,
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

  const activePopupCoordinates = useMemo(() => {
    if (!activePlaceId) return null;
    const feature = (placesGeoJSON.features || []).find(
      (item) => item.properties?.pid === activePlaceId
    );
    const coords = feature?.geometry?.coordinates;
    if (!coords || coords.length < 2) return null;
    return { lng: coords[0], lat: coords[1] };
  }, [activePlaceId, placesGeoJSON]);

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

  function removeTag(tag: string) {
    setSelectedTags((prev) => prev.filter((x) => x !== tag));
  }

  function toggleCategory(category: string) {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((x) => x !== category) : [...prev, category]
    );
  }

  function removeCategory(category: string) {
    setSelectedCategories((prev) => prev.filter((x) => x !== category));
  }

  function toggleTagGroup(groupId: string) {
    setExpandedTagGroups((prev) => {
      const nextValue = !prev[groupId];
      if (!nextValue) {
        return {
          ...prev,
          [groupId]: false,
        };
      }

      const collapsed = Object.fromEntries(
        Object.keys(prev).map((key) => [key, false])
      ) as Record<string, boolean>;
      return {
        ...collapsed,
        [groupId]: true,
      };
    });
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

  function selectPlaceSuggestion(p: Place) {
    setSuggestOpen(false);
    setSuggestHighlight(-1);
    const label = [p.organization, p.office].filter(Boolean).join(" — ").trim();
    const orgQuery = [p.organization, p.office].filter(Boolean).join(" ").trim();
    setSearchInput(label);
    setQuery(orgQuery);
    setSearchMode("organization");
    setNearError(null);
    focusPlace(p);
  }

  async function exportToPDF(exportAll: boolean) {
    setIsExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const cleanWebsiteLabel = (raw: string | null) => {
        const safe = safeUrl(raw);
        if (!safe) return "";
        try {
          const u = new URL(safe);
          return u.hostname.replace(/^www\./, "");
        } catch {
          return safe;
        }
      };

      const dataToExport = exportAll ? filteredUnique : paginatedResults;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      const footerText =
        "This map compiles publicly available information from online sources and third-party platforms. It is exploratory and non-exhaustive; details may be incomplete or outdated. Please verify information directly with service providers.";
      const footerFontSizeBase = 10;
      const footerLineHeight = 4;
      const footerLines = doc.splitTextToSize(footerText, contentWidth);
      const footerHeight = footerLines.length * footerLineHeight + 2;
      let yPosition = margin;

      // Helper function to add a new page if needed
      const checkNewPage = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - margin - footerHeight) {
          doc.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Add header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Arrival Resources - List View", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.text(`Generated: ${dateStr}`, margin, yPosition);
      yPosition += 6;

      doc.text(`Export: ${exportAll ? "All Results" : "Current Page"} (${dataToExport.length} ${dataToExport.length === 1 ? "result" : "results"})`, margin, yPosition);
      yPosition += 6;

      // Add filter info if any
      if (query || selectedTags.length > 0 || selectedCategories.length > 0) {
        const filterText = [
          query ? `Search: "${query}"` : null,
          selectedTags.length > 0 ? `Tags: ${selectedTags.map(t => tagLabel.get(t) ?? t).join(", ")}` : null,
          selectedCategories.length > 0 ? `Categories: ${selectedCategories.join(", ")}` : null,
        ].filter(Boolean).join(" | ");
        doc.text(`Filters: ${filterText}`, margin, yPosition);
        yPosition += 6;
      }

      yPosition += 4;
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Add places
      doc.setFontSize(11);
      for (let i = 0; i < dataToExport.length; i++) {
        const p = dataToExport[i];

        // Check if we need a new page
        const estimatedHeight = 50; // Rough estimate
        checkNewPage(estimatedHeight);

        // Place name
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        const name = p.office || p.organization || "(No name)";
        const nameLines = doc.splitTextToSize(name, contentWidth);
        doc.text(nameLines, margin, yPosition);
        yPosition += nameLines.length * 6;

        // Organization
        if (p.organization && p.organization !== name) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.text(p.organization, margin, yPosition);
          yPosition += 5;
        }

        // Address
        if (p.address) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.text(p.address, margin, yPosition);
          yPosition += 5;
        }

        // Contact info
        const contactInfo: string[] = [];
        if (p.phone) contactInfo.push(`Phone: ${p.phone}`);
        if (p.email) contactInfo.push(`Email: ${p.email}`);
        const websiteLabel = cleanWebsiteLabel(p.website);
        if (websiteLabel) contactInfo.push(`Website: ${websiteLabel}`);

        if (contactInfo.length > 0) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          const contactLines = doc.splitTextToSize(contactInfo.join(" | "), contentWidth);
          doc.text(contactLines, margin, yPosition);
          yPosition += contactLines.length * 5;
        }

        // Service tags
        if (p.service_tags && p.service_tags.length > 0) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          const tagsText = p.service_tags.map(t => tagLabel.get(t) ?? t).join(", ");
          const tagLines = doc.splitTextToSize(`Service Tags: ${tagsText}`, contentWidth);
          doc.text(tagLines, margin, yPosition);
          yPosition += tagLines.length * 5;
        }

        yPosition += 2;
        if (i < dataToExport.length - 1) {
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 5;
        }
      }

      const totalPages = Math.max(1, doc.internal.pages.length - 1);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(footerFontSizeBase);
      const footerLinesWrapped = doc.splitTextToSize(footerText, contentWidth);
      for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        const footerY = pageHeight - margin - (footerLinesWrapped.length - 1) * footerLineHeight;
        doc.text(footerLinesWrapped, margin, footerY);
      }

      // Save PDF
      const filename = `arrival-resources-list-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
      setShowExportDialog(false);
    }
  }

  function renderTagButton(tag: string) {
    const active = selectedTags.includes(tag);
    return (
      <Button
        key={tag}
        variant="outline"
        size="sm"
        aria-pressed={active}
        className={`rounded-full h-8 px-3 ${
          active
            ? "border-primary bg-primary/18 shadow-sm ring-2 ring-primary/25 hover:bg-primary/22"
            : "hover:bg-secondary"
        }`}
        onClick={() => toggleTag(tag)}
        title={tagMeta.get(tag)?.description || ""}
      >
        {tagLabel.get(tag) ?? tag}
      </Button>
    );
  }

  function renderCategoryButton(category: string, count?: number) {
    const active = selectedCategories.includes(category);
    return (
      <Button
        key={category}
        variant="outline"
        size="sm"
        aria-pressed={active}
        className={`rounded-full h-8 px-3 ${
          active
            ? "border-primary bg-primary/18 shadow-sm ring-2 ring-primary/25 hover:bg-primary/22"
            : "hover:bg-secondary"
        }`}
        onClick={() => toggleCategory(category)}
      >
        <span
          aria-hidden
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: categoryColor(category),
            display: "inline-block",
            marginRight: 6,
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        />
        {category}
        {typeof count === "number" ? (
          <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>{count}</span>
        ) : null}
      </Button>
    );
  }

  function renderPopupAction(place: Place, kind: "website" | "directions" | "phone" | "email") {
    const config = {
      website: {
        href: safeUrl(place.website),
        label: "Website",
        icon: Globe,
      },
      directions: {
        href: safeUrl(place.directions_url),
        label: "Directions",
        icon: MapPinned,
      },
      phone: {
        href: place.phone ? `tel:${place.phone}` : null,
        label: place.phone || "Phone",
        icon: Phone,
      },
      email: {
        href: place.email ? `mailto:${place.email}` : null,
        label: "Email",
        icon: Mail,
      },
    }[kind];

    if (!config.href) return null;

    const Icon = config.icon;
    return (
      <a
        key={kind}
        href={config.href}
        target={kind === "website" || kind === "directions" ? "_blank" : undefined}
        rel={kind === "website" || kind === "directions" ? "noreferrer" : undefined}
        title={config.label}
        className="arrival-popup-action"
      >
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{config.label}</span>
      </a>
    );
  }

  function renderListAction(place: Place, kind: "website" | "directions" | "phone" | "email") {
    const config = {
      website: {
        href: safeUrl(place.website),
        label: "Website",
        icon: Globe,
      },
      directions: {
        href: safeUrl(place.directions_url) || safeUrl(place.maps_url),
        label: "Directions",
        icon: MapPinned,
      },
      phone: {
        href: place.phone ? `tel:${place.phone}` : null,
        label: place.phone || "Phone",
        icon: Phone,
      },
      email: {
        href: place.email ? `mailto:${place.email}` : null,
        label: "Email",
        icon: Mail,
      },
    }[kind];

    if (!config.href) return null;

    const Icon = config.icon;
    return (
      <a
        key={kind}
        href={config.href}
        target={kind === "website" || kind === "directions" ? "_blank" : undefined}
        rel={kind === "website" || kind === "directions" ? "noreferrer" : undefined}
        className="arrival-list-action"
        title={config.label}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{config.label}</span>
      </a>
    );
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
              display: "inline-flex",
              gap: 4,
              border: "1px solid var(--primary-border-35)",
              borderRadius: 999,
              padding: 5,
              background: "var(--surface-2)",
            }}
            aria-label="View mode"
          >
            <Button
              type="button"
              variant={viewMode === "map" ? "default" : "ghost"}
              size="default"
              onClick={() => setViewMode("map")}
              className={
                viewMode === "map"
                  ? "rounded-full gap-2 px-4 font-semibold shadow-sm"
                  : "rounded-full gap-2 px-4 text-muted-foreground"
              }
            >
              <MapIcon className="h-4 w-4 shrink-0" aria-hidden />
              Map
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "default" : "ghost"}
              size="default"
              onClick={() => setViewMode("list")}
              className={
                viewMode === "list"
                  ? "rounded-full gap-2 px-4 font-semibold shadow-sm"
                  : "rounded-full gap-2 px-4 text-muted-foreground"
              }
            >
              <LayoutList className="h-4 w-4 shrink-0" aria-hidden />
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
        gridTemplateRows: isMobile ? "auto 1fr auto" : "auto",
        alignItems: "start",
      }}>
        {/* Mobile: when sidebar closed, show Filters chip to open it */}
        {isMobile && !sidebarOpen ? (
          <div style={{ gridColumn: "1 / -1", gridRow: 1, display: "flex", alignItems: "center" }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="rounded-full"
              aria-label="Open filters"
            >
              Filters
            </Button>
          </div>
        ) : null}
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
              : "auto",
            maxHeight: isMobile ? "60vh" : "none",
            overflow: isMobile ? "auto" : "visible",
            background: "var(--surface-2)",
            boxShadow: "var(--shadow-sm)",
            gridColumn: isMobile ? "1 / -1" : "1",
            gridRow: isMobile ? "1" : "1",
            transition: isMobile ? "max-height 0.3s ease, opacity 0.3s ease" : "none",
            opacity: isMobile && !sidebarOpen ? 0 : 1,
          }}
        >
          {/* Unified search (name, ZIP, or address) + Near me */}
          <div ref={searchWrapRef} style={{ display: "grid", gap: 8 }}>
            <div style={{ position: "relative", width: "100%" }}>
              <Input
                className="flex-1 h-10 w-full pr-8"
                value={searchInput}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearchInput(v);
                  setSuggestHighlight(-1);
                  setSuggestOpen(v.trim().length >= 2);
                }}
                onFocus={() => {
                  if (searchInput.trim().length >= 2) setSuggestOpen(true);
                }}
                onKeyDown={(e) => {
                  const list = placeAutocompleteSuggestions;
                  if (e.key === "ArrowDown") {
                    if (list.length === 0) return;
                    e.preventDefault();
                    setSuggestOpen(true);
                    setSuggestHighlight((h) =>
                      h < 0 ? 0 : Math.min(list.length - 1, h + 1)
                    );
                    return;
                  }
                  if (e.key === "ArrowUp") {
                    if (list.length === 0) return;
                    e.preventDefault();
                    setSuggestHighlight((h) => Math.max(-1, h - 1));
                    return;
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setSuggestOpen(false);
                    setSuggestHighlight(-1);
                    return;
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (
                      suggestOpen &&
                      suggestHighlight >= 0 &&
                      list[suggestHighlight]
                    ) {
                      selectPlaceSuggestion(list[suggestHighlight]);
                    } else {
                      submitUnifiedSearch();
                    }
                  }
                }}
                placeholder="Search by organization name, zip code, or address."
                style={{ background: "var(--surface)" }}
                role="combobox"
                aria-expanded={suggestOpen && placeAutocompleteSuggestions.length > 0}
                aria-controls={
                  suggestOpen && placeAutocompleteSuggestions.length > 0
                    ? "place-search-suggestions"
                    : undefined
                }
                aria-autocomplete="list"
              />
              {searchInput.trim() !== "" && (
                <button
                  type="button"
                  onClick={clearUnifiedSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search and reset map"
                  title="Clear search and reset map"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {suggestOpen && placeAutocompleteSuggestions.length > 0 ? (
                <div
                  id="place-search-suggestions"
                  role="listbox"
                  className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md"
                >
                  {placeAutocompleteSuggestions.map((p, i) => {
                    const primary = (p.organization || "").trim() || (p.office || "").trim();
                    const secondary = (p.office || "").trim();
                    const sub =
                      secondary && primary !== secondary ? secondary : (p.address || "").trim();
                    return (
                      <button
                        key={placeKey(p)}
                        type="button"
                        role="option"
                        aria-selected={i === suggestHighlight}
                        className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent ${
                          i === suggestHighlight ? "bg-accent" : ""
                        }`}
                        onMouseEnter={() => setSuggestHighlight(i)}
                        onMouseDown={(ev) => {
                          ev.preventDefault();
                          selectPlaceSuggestion(p);
                        }}
                      >
                        <span className="font-medium text-foreground">{primary}</span>
                        {sub ? (
                          <span className="text-xs text-muted-foreground">{sub}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <Button
                type="button"
                className="h-10"
                onClick={submitUnifiedSearch}
                disabled={searchGeocoding}
                style={{ whiteSpace: "nowrap" }}
              >
                {searchGeocoding ? "Searching…" : "Search"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={requestUserNearMe}
                disabled={nearMeLoading}
                title="Center the map on your current location (browser permission required)"
                style={{ whiteSpace: "nowrap" }}
              >
                {nearMeLoading ? "Locating…" : "Near me"}
              </Button>
            </div>
            {nearError ? (
              <div style={{ fontSize: 12, color: "#b91c1c" }}>{nearError}</div>
            ) : null}
          </div>

          {/* Tags */}
          <div style={{ display: "grid", gap: 10, minHeight: 0, flex: "1 1 auto" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                alignItems: "flex-start",
                marginBottom: 4,
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontWeight: 700 }}>Service Tags</div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: "var(--muted-text)",
                  }}
                >
                  Browse by need. Primary filter across Map and List views.
                </p>

                {/* Desktop: helper links under title */}
                {!isMobile && (
                  <div style={{ display: "grid", gap: 6, alignItems: "flex-start" }}>
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
                  
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setSelectedTags([])}
                title="Clear all selected service tags"
              >
                Clear all
              </Button>
            </div>

            {selectedTags.length > 0 ? (
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>
                  Active filters
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {selectedTags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => removeTag(t)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-primary/14 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm hover:bg-primary/20"
                    >
                      <span>{tagLabel.get(t) ?? t}</span>
                      <X className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                      <span className="sr-only">Remove {tagLabel.get(t) ?? t}</span>
                    </button>
                  ))}
                </div>
                {selectedTags.length >= 2 ? (
                  <p
                    style={{
                      fontSize: 12,
                      lineHeight: 1.45,
                      color: "var(--muted-text)",
                      margin: 0,
                    }}
                  >
                    Showing organizations that match{" "}
                    <strong style={{ color: "var(--text)" }}>any</strong> of the selected tags.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div
              style={{
                display: "grid",
                gap: 10,
                marginTop: 4,
                paddingRight: 2,
              }}
            >
              {groupedTagSections.length === 0 ? (
                <div
                  style={{
                    border: "1px dashed var(--border)",
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 12,
                    color: "var(--muted-text)",
                    background: "var(--surface)",
                  }}
                >
                  No service tags are available in the current results. Clear filters or move the map to see more.
                </div>
              ) : (
                groupedTagSections.map((group) => {
                  const isOpen = expandedTagGroups[group.id] ?? true;
                  return (
                    <section
                      key={group.id}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        background: "var(--surface)",
                        overflow: "hidden",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleTagGroup(group.id)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          padding: "10px 12px",
                          textAlign: "left",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                        aria-expanded={isOpen}
                        aria-controls={`tag-group-${group.id}`}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 14,
                              minWidth: 0,
                            }}
                          >
                            {group.label}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--muted-text)",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            {group.visibleTags.length} {group.visibleTags.length === 1 ? "tag" : "tags"}
                          </div>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 shrink-0" style={{ opacity: 0.65 }} />
                        ) : (
                          <ChevronDown className="h-4 w-4 shrink-0" style={{ opacity: 0.65 }} />
                        )}
                      </button>

                      {isOpen ? (
                        <div
                          id={`tag-group-${group.id}`}
                          style={{
                            display: "grid",
                            gap: 10,
                            padding: "10px 12px 12px",
                            borderTop: "1px solid rgba(0,0,0,0.04)",
                            background: "rgba(255,255,255,0.72)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              lineHeight: 1.4,
                              color: "var(--muted-text)",
                            }}
                          >
                            {group.description}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {group.visibleTags.map((tag) => renderTagButton(tag))}
                          </div>
                        </div>
                      ) : null}
                    </section>
                  );
                })
              )}
            </div>

            {/* Mobile: helper links below grouped tags */}
            {isMobile && (
              <div style={{ display: "grid", gap: 6, alignItems: "flex-start" }}>
                <div style={{ display: "grid", gap: 6, alignItems: "flex-start" }}>
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
            )}
          </div>

          <div
            style={{
              display: "grid",
              gap: 10,
              borderTop: "1px solid rgba(0,0,0,0.08)",
              paddingTop: 16,
              marginTop: 10,
            }}
          >
            <button
              type="button"
              onClick={() => setCategoryOpen((prev) => !prev)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                width: "100%",
                border: "none",
                background: "transparent",
                padding: 0,
                textAlign: "left",
                cursor: "pointer",
              }}
              aria-expanded={categoryOpen}
              aria-controls="sidebar-category-section"
            >
              <div style={{ display: "grid", gap: 3 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Category</div>
                <div style={{ fontSize: 12, color: "var(--muted-text)", lineHeight: 1.4 }}>
                  Secondary filter across both Map and List views.
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {selectedCategories.length > 0 ? (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--muted-text)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectedCategories.length} selected
                  </span>
                ) : null}
                {categoryOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0" style={{ opacity: 0.65 }} />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0" style={{ opacity: 0.65 }} />
                )}
              </div>
            </button>

            {selectedCategories.length > 0 ? (
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>
                  Selected categories
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {selectedCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => removeCategory(category)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm hover:bg-primary/16"
                    >
                      <span
                        aria-hidden
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 999,
                          background: categoryColor(category),
                          display: "inline-block",
                          border: "1px solid rgba(0,0,0,0.08)",
                        }}
                      />
                      <span>{category}</span>
                      <X className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                      <span className="sr-only">Remove {category}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {categoryOpen ? (
              <div
                id="sidebar-category-section"
                style={{
                  display: "grid",
                  gap: 10,
                  border: "1px solid rgba(0,0,0,0.06)",
                  borderRadius: 12,
                  padding: 12,
                  background: "rgba(255,255,255,0.72)",
                }}
              >
                {selectedCategories.length > 0 ? (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setSelectedCategories([])}
                      title="Clear all selected categories"
                    >
                      Clear all
                    </Button>
                  </div>
                ) : null}

                {categoryOptions.length === 0 ? (
                  <div
                    style={{
                      border: "1px dashed var(--border)",
                      borderRadius: 12,
                      padding: 12,
                      fontSize: 12,
                      color: "var(--muted-text)",
                      background: "var(--surface)",
                    }}
                  >
                    No categories are available in the current results.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {categoryOptions.map((category) =>
                      renderCategoryButton(category.label, category.count)
                    )}
                  </div>
                )}
              </div>
            ) : null}
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
              height: desktopPanelHeight,
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

        {/* RIGHT: floating additional resources trigger + map/list */}
        <div
          style={{
            position: "relative",
            gridColumn: isMobile ? "1 / -1" : "3",
            gridRow: isMobile ? "2" : "1",
            width: "100%",
          }}
        >
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                style={{
                  position: "absolute",
                  top: isMobile ? -42 : -46,
                  right: 0,
                  zIndex: 4,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: isMobile ? "8px 10px" : "9px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "rgba(255,255,255,0.96)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  color: "var(--muted-text)",
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  cursor: "pointer",
                }}
                aria-label="Open additional resources"
              >
                <span>Can&apos;t find what you need?</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader className="pb-2">
                <DialogTitle>Additional Resources</DialogTitle>
                <DialogDescription>
                  External resources for needs not fully covered by Arrival Resources.
                </DialogDescription>
              </DialogHeader>
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  maxHeight: "70vh",
                  overflowY: "auto",
                  paddingRight: 2,
                }}
              >
                {ADDITIONAL_RESOURCE_GROUPS.map((group) => (
                  <section
                    key={group.id}
                    style={{
                      display: "grid",
                      gap: 6,
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.06)",
                      background: "rgba(255,255,255,0.82)",
                    }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text)" }}>
                      {group.label}
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {group.links.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: 13,
                            lineHeight: 1.45,
                            color: "var(--primary)",
                            textDecoration: "underline",
                            textDecorationThickness: "1.5px",
                            textUnderlineOffset: 3,
                            fontWeight: 500,
                            transition: "color 0.15s ease, text-decoration-color 0.15s ease, opacity 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--accent-strong)";
                            e.currentTarget.style.textDecorationColor = "var(--accent-strong)";
                            e.currentTarget.style.opacity = "1";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--primary)";
                            e.currentTarget.style.textDecorationColor = "var(--primary)";
                            e.currentTarget.style.opacity = "0.92";
                          }}
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              overflow: "hidden",
              height: isMobile 
                ? "calc(100dvh - 280px)" 
                : desktopPanelHeight,
              minHeight: isMobile ? 400 : undefined,
              position: "relative",
              background: "var(--surface)",
              boxShadow: "var(--shadow-sm)",
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
                  setMapError(null);
                  try {
                    setCurrentZoom(mapRef.current?.getZoom() || 9.5);
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
                onError={(evt) => {
                  const err: any = (evt as any)?.error || evt;
                  const msg = err?.message || err?.error?.message || String(err || "Unknown Mapbox error");
                  console.error("Mapbox error:", err);
                  setMapError(msg);
                }}
                onMoveEnd={() => {
                  try {
                    setCurrentZoom(mapRef.current?.getZoom() || 9.5);
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
                    setCurrentZoom(mapRef.current?.getZoom() || 9.5);
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
                interactiveLayerIds={["clusters", "unclustered-hit-area", "unclustered-point"]}
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
                            { label: "Government Office", color: categoryColor("government") },
                            { label: "Education Center", color: categoryColor("education") },
                            { label: "Health Center", color: categoryColor("health center") },
                            { label: "Religious / Faith-based", color: categoryColor("religious") },
                            { label: "Community Center", color: categoryColor("community center") },
                            { label: "Community Organization", color: categoryColor("community organization") },
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
                {mapError ? (
                  <div
                    style={{
                      position: "absolute",
                      left: 12,
                      bottom: 12,
                      zIndex: 3,
                      background: "rgba(255,255,255,0.95)",
                      border: "1px solid rgba(185, 28, 28, 0.35)",
                      borderRadius: 12,
                      padding: "10px 12px",
                      maxWidth: 520,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      color: "#7f1d1d",
                      fontSize: 12,
                      lineHeight: 1.4,
                    }}
                    role="alert"
                  >
                    <div style={{ fontWeight: 800, marginBottom: 4 }}>Map error</div>
                    <div style={{ opacity: 0.95 }}>{mapError}</div>
                    <div style={{ marginTop: 6, opacity: 0.8 }}>
                      Tip: open DevTools → Network, filter "mapbox", and check for 401/403 on style/tiles.
                    </div>
                  </div>
                ) : null}
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
                  <Layer {...unclusteredHitAreaLayer} />
                  <Layer {...unclusteredPointLayer} />
                </Source>

                {activePlace &&
                activePopupCoordinates ? (
                  <Popup
                    longitude={activePopupCoordinates.lng}
                    latitude={activePopupCoordinates.lat}
                    anchor="top"
                    onClose={() => setActivePlaceId(null)}
                    closeButton
                    closeOnClick={false}
                    maxWidth={isMobile ? "calc(100vw - 32px)" : "340px"}
                    className="arrival-popup"
                  >
                    <div style={{ display: "grid", gap: 10 }}>
                      {getPhotoSrc(activePlace.photo_ref, activePlace.place_id) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getPhotoSrc(activePlace.photo_ref, activePlace.place_id) as string}
                          alt="Place photo"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = PLACEHOLDER_IMAGE;
                          }}
                          style={{
                            width: "100%",
                            height: 140,
                            objectFit: "cover",
                            borderRadius: 10,
                            border: "1px solid rgba(0,0,0,0.06)",
                          }}
                        />
                      ) : null}

                      <div style={{ display: "grid", gap: 4 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.3 }}>
                          {activePlace.office || activePlace.organization || "(No name)"}
                        </div>
                        {activePlace.organization &&
                        activePlace.organization !== (activePlace.office || activePlace.organization) ? (
                          <div style={{ fontSize: 12.5, color: "var(--muted-text)", lineHeight: 1.4 }}>
                            {activePlace.organization}
                          </div>
                        ) : null}
                        {activePlace.address ? (
                          <div style={{ fontSize: 12.5, color: "var(--muted-text)", lineHeight: 1.45 }}>
                            {activePlace.address}
                          </div>
                        ) : null}
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                          gap: 8,
                          marginTop: 2,
                        }}
                      >
                        {[
                          renderPopupAction(activePlace, "website"),
                          renderPopupAction(activePlace, "directions"),
                          renderPopupAction(activePlace, "phone"),
                          renderPopupAction(activePlace, "email"),
                        ].filter(Boolean)}
                      </div>

                      {activePlace.service_tags?.length ? (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                            marginTop: 2,
                          }}
                        >
                          {activePlace.service_tags.map((t) => (
                            <span
                              key={t}
                              style={{
                                fontSize: 11.5,
                                border: "1px solid rgba(0,0,0,0.1)",
                                borderRadius: 999,
                                padding: "2px 8px",
                                background: "rgba(255,255,255,0.7)",
                                color: "rgba(17,24,39,0.82)",
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 800 }}>Results</div>
                {filteredUnique.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExportDialog(true)}
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? "Preparing..." : "Print / Save PDF"}
                  </Button>
                )}
              </div>
              <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Print or Save as PDF</DialogTitle>
                    <DialogDescription>
                      Choose how many results to include.
                    </DialogDescription>
                  </DialogHeader>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => exportToPDF(false)}
                      disabled={isExporting}
                      style={{ justifyContent: "flex-start", textAlign: "left", padding: "24px 30px" }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                        <div style={{ fontWeight: 600 }}>Current page only</div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                          Include {paginatedResults.length} result{paginatedResults.length !== 1 ? "s" : ""} from page {currentPage}
                        </div>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => exportToPDF(true)}
                      disabled={isExporting}
                      style={{ justifyContent: "flex-start", textAlign: "left", padding: "24px 30px" }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                        <div style={{ fontWeight: 600 }}>All filtered results</div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                          Include all {filteredUnique.length} filtered result{filteredUnique.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <div style={{ display: "grid", gap: 12 }}>
                {paginatedResults.map((p) => {
                  const pid = placeKey(p);
                  const isActive = !!activePlaceId && pid === activePlaceId;
                  const photo = getPhotoSrc(p.photo_ref, p.place_id);

                  return (
                    <div
                      key={pid}
                      style={{
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: 14,
                        padding: 14,
                        background: isActive ? "#f7f7f5" : "white",
                      }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: photo ? "120px 1fr" : "1fr", gap: 12 }}>
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photo}
                            alt="Place photo"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = PLACEHOLDER_IMAGE;
                            }}
                            style={{ width: 120, height: 120, borderRadius: 12, objectFit: "cover", border: "1px solid #eee" }}
                          />
                        ) : null}

                        <div style={{ display: "grid", gap: 6 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span
                              style={{ width: 10, height: 10, borderRadius: 999, background: categoryColor(p.category) }}
                            />
                            <div style={{ fontWeight: 900, fontSize: 16, lineHeight: 1.3 }}>
                              {p.office || p.organization || "(No name)"}
                            </div>
                          </div>
                          {p.organization && p.organization !== (p.office || p.organization) ? (
                            <div style={{ fontSize: 13, color: "var(--muted-text)" }}>{p.organization}</div>
                          ) : null}
                          {p.address ? (
                            <div style={{ fontSize: 13, color: "var(--muted-text)", lineHeight: 1.45 }}>{p.address}</div>
                          ) : null}

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, max-content))",
                              gap: 8,
                              marginTop: 4,
                              alignItems: "center",
                            }}
                          >
                            {[
                              renderListAction(p, "website"),
                              renderListAction(p, "directions"),
                              renderListAction(p, "phone"),
                              renderListAction(p, "email"),
                            ].filter(Boolean)}
                          </div>

                          {p.service_tags?.length ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                              {p.service_tags.map((t) => (
                                <span
                                  key={t}
                                  style={{
                                    fontSize: 11.5,
                                    border: "1px solid rgba(0,0,0,0.1)",
                                    borderRadius: 999,
                                    padding: "2px 8px",
                                    background: "rgba(255,255,255,0.7)",
                                    color: "rgba(17,24,39,0.82)",
                                  }}
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
              {filteredUnique.length > 0 && (
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: "1px solid #eee",
                  flexWrap: "wrap",
                  gap: 12
                }}>
                  <div style={{ fontSize: 14, opacity: 0.8 }}>
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUnique.length)} of {filteredUnique.length} results
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                      <span>Page</span>
                      <input
                        type="number"
                        min={1}
                        max={Math.max(1, totalPages)}
                        value={currentPage}
                        onChange={(event) => {
                          const next = Number(event.target.value);
                          if (!Number.isFinite(next)) return;
                          const clamped = Math.min(Math.max(1, next), Math.max(1, totalPages));
                          setCurrentPage(clamped);
                        }}
                        style={{
                          width: 64,
                          padding: "4px 6px",
                          borderRadius: 8,
                          border: "1px solid #ddd",
                          textAlign: "center",
                          fontSize: 14,
                        }}
                      />
                      <span>of {totalPages || 1}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>

      </section>

      {/* Map popup close button style */}
      <style jsx global>{`
        .arrival-popup .mapboxgl-popup-content {
          border-radius: 14px;
          /* Allow long tag lists to be visible/scrollable instead of being clipped */
          overflow: visible;
          max-height: 70vh;
          overflow-y: auto;
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

        .arrival-popup .arrival-popup-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 36px;
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.9);
          color: var(--foreground);
          font-size: 12px;
          font-weight: 600;
          line-height: 1.2;
          text-decoration: none;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }

        .arrival-popup .arrival-popup-action:hover {
          background: var(--primary-soft-10);
          border-color: rgba(146, 64, 14, 0.18);
          color: var(--accent-strong);
          text-decoration: none;
        }

        .arrival-list-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 34px;
          padding: 7px 10px;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.92);
          color: var(--foreground);
          font-size: 12px;
          font-weight: 600;
          line-height: 1.2;
          text-decoration: none;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }

        .arrival-list-action:hover {
          background: var(--primary-soft-10);
          border-color: rgba(146, 64, 14, 0.18);
          color: var(--accent-strong);
          text-decoration: none;
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
          .arrival-popup .mapboxgl-popup-content {
            max-height: 60vh;
          }
        }
      `}</style>
      </main>
    </div>
  );
}
