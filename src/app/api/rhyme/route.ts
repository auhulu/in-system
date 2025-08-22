import { type NextRequest, NextResponse } from "next/server";
import { searchRhyme } from "../../../lib/searchRhyme";

export async function POST(request: NextRequest) {
	try {
		const { text } = await request.json();

		if (!text || typeof text !== "string") {
			return NextResponse.json({ error: "text is required" }, { status: 400 });
		}

		const result = await searchRhyme(text);

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error in rhyme API:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
