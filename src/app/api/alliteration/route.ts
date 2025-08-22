import { type NextRequest, NextResponse } from "next/server";
import { searchAlliteration } from "../../../lib/searchRhyme";

export async function POST(request: NextRequest) {
	try {
		const { text, minLength = 3 } = await request.json();

		if (!text || typeof text !== "string") {
			return NextResponse.json({ error: "text is required" }, { status: 400 });
		}

		const result = await searchAlliteration(text, minLength);

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error in alliteration API:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
