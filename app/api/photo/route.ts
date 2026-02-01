import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref");
  const placeId = searchParams.get("placeId") || searchParams.get("place_id");
  const wParam = searchParams.get("w") || "400";
  const wNum = Number.parseInt(wParam, 10);
  const w = Number.isFinite(wNum) ? Math.min(1600, Math.max(50, wNum)) : 400;

  // We can fetch a photo either by legacy/new ref OR by placeId (fallback to Places Details (New)).
  if (!ref && !placeId) {
    return NextResponse.json({ error: "Missing ref (or placeId)" }, { status: 400 });
  }

  // Prefer a Places key if you have one; fall back to a Maps key.
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Missing GOOGLE_PLACES_API_KEY (or GOOGLE_MAPS_API_KEY) in .env.local" },
      { status: 500 }
    );
  }

  // Google has two photo mechanisms depending on which Places API returned the photo reference.
  // - Legacy Places API returns a `photo_reference` string used with the `maps.googleapis.com/maps/api/place/photo` endpoint.
  // - Places API (New) returns a photo resource name like `places/{placeId}/photos/{photoId}` which must be fetched via
  //   `https://places.googleapis.com/v1/{photoName}/media?...`.
  const isNewPlacesPhotoName = !!ref && (ref.startsWith("places/") || ref.includes("/photos/"));

  const buildNewPhotoUrl = (photoName: string) => {
    // photoName is expected to look like: "places/<PLACE_ID>/photos/<PHOTO_ID>"
    // IMPORTANT: do NOT encode slashes in the path. Only encode query params.
    const u = new URL(`https://places.googleapis.com/v1/${photoName}/media`);
    u.searchParams.set("maxWidthPx", String(w));
    u.searchParams.set("key", key);
    return u.toString();
  };

  const buildLegacyPhotoUrl = (photoRef: string) =>
    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${w}&photoreference=${encodeURIComponent(
      photoRef
    )}&key=${encodeURIComponent(key)}`;

  const buildDetailsNewUrl = (pid: string) => {
    // placeId should be used as-is in the resource path.
    const u = new URL(`https://places.googleapis.com/v1/places/${pid}`);
    u.searchParams.set("fields", "photos");
    u.searchParams.set("key", key);
    return u.toString();
  };

  // Initial attempt URL: if we have a ref, use it directly. Otherwise we will fall back via placeId.
  let url = ref
    ? isNewPlacesPhotoName
      ? buildNewPhotoUrl(ref)
      : buildLegacyPhotoUrl(ref)
    : "";

  // If your Google API key is restricted by HTTP referrers, requests without a Referer header
  // can return a generic HTML 400. Set GOOGLE_MAPS_REFERER in `.env.local` (e.g.,
  // http://localhost:3000 for dev and your production domain later) to include it.
  const referer = process.env.GOOGLE_MAPS_REFERER;

  const headers: Record<string, string> = {
    // Some Google endpoints are picky about missing/unknown UA/Accept headers
    "user-agent": "Mozilla/5.0",
    accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  };

  if (referer) {
    headers.referer = referer;
    // Some Google checks also consider Origin.
    try {
      headers.origin = new URL(referer).origin;
    } catch {
      // ignore
    }
  }

  const fetchUpstream = async (u: string) =>
    fetch(u, {
      redirect: "follow",
      cache: "no-store",
      headers,
    });

  let upstream = url ? await fetchUpstream(url) : null;

  // Fallback: legacy photo_reference values can expire and return a generic HTML 400.
  // If we have a placeId, fetch a fresh photo name via Place Details (New) and then request the photo via Place Photos (New).
  if ((!upstream || !upstream.ok) && placeId) {
    // Only do the fallback when the first attempt is clearly unusable.
    const firstStatus = upstream?.status;

    // Fetch photos[] for the place.
    const detailsResp = await fetchUpstream(buildDetailsNewUrl(placeId));
    if (detailsResp.ok) {
      const detailsJson: any = await detailsResp.json().catch(() => null);
      const firstPhotoName: string | undefined = detailsJson?.photos?.[0]?.name;
      if (firstPhotoName) {
        url = buildNewPhotoUrl(firstPhotoName);
        upstream = await fetchUpstream(url);
      } else if (!upstream) {
        // No ref and no photos.
        upstream = detailsResp;
      }
    } else if (!upstream) {
      upstream = detailsResp;
    }

    // If we had a first attempt, keep logging of its status by attaching it to the error message below.
    if (firstStatus && upstream && !upstream.ok) {
      console.error("Photo fallback also failed. First status:", firstStatus, "Second status:", upstream.status);
    }
  }

  if (!upstream) {
    return NextResponse.json({ error: "Upstream error", status: 502, body: "No upstream request made" }, { status: 502 });
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    const ct = upstream.headers.get("content-type") || "";
    console.error("Google Places Photo upstream error:", upstream.status, url, ct, text);

    // If Google returns JSON error details, pass them through so you can diagnose quickly.
    return NextResponse.json(
      {
        error: "Upstream error",
        status: upstream.status,
        contentType: ct,
        body: text.slice(0, 2000),
        hint: isNewPlacesPhotoName
          ? "This looks like a Places API (New) photo name. Ensure Places API (New) is enabled for your key and places.googleapis.com is allowed."
          : placeId
          ? "Legacy photo_reference can expire and return 400. This route attempts a Places Details (New) fallback using placeId. Ensure Places API (New) is enabled and placeId is valid."
          : "This looks like a legacy photo_reference. Ensure Places API is enabled and the photo reference is valid (it may have expired).",
      },
      { status: 502 }
    );
  }

  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  const body = await upstream.arrayBuffer();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=604800, s-maxage=604800",
    },
  });
}
