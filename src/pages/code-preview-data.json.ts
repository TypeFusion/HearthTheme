import type { APIRoute } from "astro";
import { buildPreviewRenderMap } from "../lib/codePreview";

export const prerender = true;

export const GET: APIRoute = async () => {
	const rendered = await buildPreviewRenderMap();

	return new Response(JSON.stringify({ rendered }), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
		},
	});
};
