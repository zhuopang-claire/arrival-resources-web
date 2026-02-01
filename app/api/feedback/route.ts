import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category, name, email, comment } = body;

    // Validate required fields
    if (!category || !name || !email || !comment) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Get Airtable credentials from environment variables
    const airtableBaseId = process.env.AIRTABLE_BASE_ID;
    const airtableTableName = process.env.AIRTABLE_TABLE_NAME || "Feedback";
    const airtableApiKey = process.env.AIRTABLE_API_KEY;

    if (!airtableBaseId || !airtableApiKey) {
      console.error("Missing Airtable configuration:", {
        hasBaseId: !!airtableBaseId,
        hasApiKey: !!airtableApiKey,
        tableName: airtableTableName,
      });
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      );
    }

    // Prepare data for Airtable
    // NOTE: Field names must match EXACTLY (case-sensitive) with your Airtable table fields
    // Required fields: Category, Name, Email, Comment
    // Optional field: Submitted At (will be added automatically if the field exists)
    const airtableData = {
      records: [
        {
          fields: {
            Category: category,
            Name: name,
            Email: email,
            Comment: comment,
            "Submitted At": new Date().toISOString(),
          },
        },
      ],
    };

    // Send to Airtable
    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent(airtableTableName)}`;
    
    console.log("Sending to Airtable:", {
      baseId: airtableBaseId?.substring(0, 10) + "...",
      tableName: airtableTableName,
      url: airtableUrl,
    });
    
    const response = await fetch(airtableUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${airtableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(airtableData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to save feedback. Please try again.";
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
        console.error("Airtable API error:", JSON.stringify(errorJson, null, 2));
      } catch {
        console.error("Airtable error (raw):", errorText);
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json(
      { success: true, id: result.records[0].id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Feedback submission error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

