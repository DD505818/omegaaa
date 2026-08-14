import { createRequestHandler } from "react-router";

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: OmegaEnv;
			ctx: ExecutionContext;
		};
	}
}

type ChatRole = "user" | "assistant";
type OmegaModel = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

interface ChatMessage {
	role: ChatRole;
	content: string;
}

interface AiRequestBody {
	prompt?: string;
	messages?: ChatMessage[];
	max_tokens?: number;
	temperature?: number;
}

interface OmegaEnv extends Env {
	AI: Ai;
	AI_RATE_LIMITER: RateLimit;
	OMEGA_MODE: string;
	LIVE_TRADING_ENABLED: string;
	AI_MODEL: OmegaModel;
	ALLOWED_ORIGINS: string;
	OMEGA_API_TOKEN?: string;
}

const OMEGA_SYSTEM_PROMPT = `You are ΩMEGA PRIME Δ Copilot, the research and operator-assistance layer for a risk-first trading platform.

Operating law:
- Intelligence proposes.
- AEGIS decides.
- Execution obeys.
- Audit proves.
- Capital survives.

You may analyze markets, explain system state, summarize evidence, and propose PAPER-mode research actions. You are not an execution authority. Never claim that you placed, approved, funded, signed, or executed a trade. Never provide an approval artifact. Broker credentials, wallet private keys, and signing secrets are outside your authority. Any trade proposal must remain advisory and must pass deterministic AEGIS risk controls and the execution service.`;

const MAX_BODY_BYTES = 64 * 1024;
const MAX_MESSAGES = 24;
const MAX_TOTAL_CHARS = 24_000;
const DEFAULT_MAX_TOKENS = 512;
const MAX_OUTPUT_TOKENS = 1_024;

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

function securityHeaders(): Headers {
	return new Headers({
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options": "DENY",
		"Referrer-Policy": "no-referrer",
		"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
		"Cache-Control": "no-store",
	});
}

function jsonResponse(data: unknown, status = 200, extra?: HeadersInit): Response {
	const headers = securityHeaders();
	headers.set("Content-Type", "application/json; charset=utf-8");
	if (extra) {
		for (const [key, value] of new Headers(extra)) headers.set(key, value);
	}
	return Response.json(data, { status, headers });
}

function allowedOrigin(request: Request, env: OmegaEnv): string | null {
	const origin = request.headers.get("Origin");
	if (!origin) return null;

	const allowed = env.ALLOWED_ORIGINS.split(",")
		.map((value) => value.trim())
		.filter(Boolean);

	return allowed.includes(origin) ? origin : null;
}

function corsHeaders(request: Request, env: OmegaEnv): Headers {
	const headers = new Headers();
	const origin = allowedOrigin(request, env);
	if (!origin) return headers;

	headers.set("Access-Control-Allow-Origin", origin);
	headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
	headers.set("Access-Control-Allow-Headers", "Authorization,Content-Type,X-Omega-API-Key");
	headers.set("Access-Control-Max-Age", "86400");
	headers.set("Vary", "Origin");
	return headers;
}

function withCors(response: Response, request: Request, env: OmegaEnv): Response {
	const headers = new Headers(response.headers);
	for (const [key, value] of corsHeaders(request, env)) headers.set(key, value);
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function extractCredential(request: Request): string {
	const authorization = request.headers.get("Authorization") ?? "";
	const bearer = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
	return bearer || request.headers.get("X-Omega-API-Key")?.trim() || "";
}

async function sha256Hex(value: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function secureEqual(left: string, right: string): Promise<boolean> {
	const [leftHash, rightHash] = await Promise.all([sha256Hex(left), sha256Hex(right)]);
	if (leftHash.length !== rightHash.length) return false;

	let diff = 0;
	for (let i = 0; i < leftHash.length; i += 1) {
		diff |= leftHash.charCodeAt(i) ^ rightHash.charCodeAt(i);
	}
	return diff === 0;
}

async function isAuthorized(request: Request, env: OmegaEnv): Promise<boolean> {
	if (!env.OMEGA_API_TOKEN) return false;
	const supplied = extractCredential(request);
	return supplied ? secureEqual(supplied, env.OMEGA_API_TOKEN) : false;
}

async function enforceAiRateLimit(request: Request, env: OmegaEnv): Promise<Response | null> {
	const credential = extractCredential(request);
	if (!credential) return jsonResponse({ error: "unauthorized" }, 401, { "WWW-Authenticate": "Bearer" });

	const fingerprint = await sha256Hex(credential);
	const pathname = new URL(request.url).pathname;
	const { success } = await env.AI_RATE_LIMITER.limit({ key: `${fingerprint}:${pathname}` });
	if (!success) {
		return jsonResponse(
			{ error: "rate_limit_exceeded", retry_after_seconds: 60 },
			429,
			{ "Retry-After": "60" },
		);
	}
	return null;
}

async function parseAiRequest(request: Request): Promise<
	| { ok: true; messages: Array<{ role: "system" | ChatRole; content: string }>; maxTokens: number; temperature: number }
	| { ok: false; response: Response }
> {
	const contentType = request.headers.get("Content-Type") ?? "";
	if (!contentType.toLowerCase().includes("application/json")) {
		return { ok: false, response: jsonResponse({ error: "content_type_must_be_application_json" }, 415) };
	}

	const contentLength = Number(request.headers.get("Content-Length") ?? "0");
	if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
		return { ok: false, response: jsonResponse({ error: "request_body_too_large" }, 413) };
	}

	let body: AiRequestBody;
	try {
		body = (await request.json()) as AiRequestBody;
	} catch {
		return { ok: false, response: jsonResponse({ error: "invalid_json" }, 400) };
	}

	const incoming: ChatMessage[] = [];
	if (typeof body.prompt === "string" && body.prompt.trim()) {
		incoming.push({ role: "user", content: body.prompt.trim() });
	}

	if (Array.isArray(body.messages)) {
		for (const message of body.messages) {
			if (!message || (message.role !== "user" && message.role !== "assistant")) {
				return { ok: false, response: jsonResponse({ error: "invalid_message_role" }, 400) };
			}
			if (typeof message.content !== "string" || !message.content.trim()) {
				return { ok: false, response: jsonResponse({ error: "invalid_message_content" }, 400) };
			}
			incoming.push({ role: message.role, content: message.content.trim() });
		}
	}

	if (incoming.length === 0) {
		return { ok: false, response: jsonResponse({ error: "prompt_or_messages_required" }, 400) };
	}
	if (incoming.length > MAX_MESSAGES) {
		return { ok: false, response: jsonResponse({ error: "too_many_messages", max: MAX_MESSAGES }, 400) };
	}

	const totalChars = incoming.reduce((total, message) => total + message.content.length, 0);
	if (totalChars > MAX_TOTAL_CHARS) {
		return { ok: false, response: jsonResponse({ error: "input_too_large", max_chars: MAX_TOTAL_CHARS }, 413) };
	}

	const maxTokens = clamp(
		Number.isFinite(body.max_tokens) ? Number(body.max_tokens) : DEFAULT_MAX_TOKENS,
		64,
		MAX_OUTPUT_TOKENS,
	);
	const temperature = clamp(
		Number.isFinite(body.temperature) ? Number(body.temperature) : 0.2,
		0,
		1.2,
	);

	return {
		ok: true,
		messages: [{ role: "system", content: OMEGA_SYSTEM_PROMPT }, ...incoming],
		maxTokens,
		temperature,
	};
}

async function handleAiStream(request: Request, env: OmegaEnv): Promise<Response> {
	if (!(await isAuthorized(request, env))) {
		return jsonResponse({ error: "unauthorized" }, 401, { "WWW-Authenticate": "Bearer" });
	}

	const rateLimited = await enforceAiRateLimit(request, env);
	if (rateLimited) return rateLimited;

	const parsed = await parseAiRequest(request);
	if (!parsed.ok) return parsed.response;

	try {
		const stream = await env.AI.run(env.AI_MODEL, {
			messages: parsed.messages,
			stream: true,
			max_tokens: parsed.maxTokens,
			temperature: parsed.temperature,
		});

		const headers = securityHeaders();
		headers.set("Content-Type", "text/event-stream; charset=utf-8");
		headers.set("Cache-Control", "no-cache, no-store");
		headers.set("Connection", "keep-alive");
		headers.set("X-Omega-Mode", env.OMEGA_MODE);
		headers.set("X-Omega-Model", env.AI_MODEL);

		return new Response(stream, { status: 200, headers });
	} catch (error) {
		console.error("Workers AI stream failed", error);
		return jsonResponse({ error: "ai_inference_failed" }, 502);
	}
}

async function handleAiGenerate(request: Request, env: OmegaEnv): Promise<Response> {
	if (!(await isAuthorized(request, env))) {
		return jsonResponse({ error: "unauthorized" }, 401, { "WWW-Authenticate": "Bearer" });
	}

	const rateLimited = await enforceAiRateLimit(request, env);
	if (rateLimited) return rateLimited;

	const parsed = await parseAiRequest(request);
	if (!parsed.ok) return parsed.response;

	try {
		const result = await env.AI.run(env.AI_MODEL, {
			messages: parsed.messages,
			stream: false,
			max_tokens: parsed.maxTokens,
			temperature: parsed.temperature,
		});

		return jsonResponse({
			service: "omega-prime-edge-api",
			mode: env.OMEGA_MODE,
			model: env.AI_MODEL,
			result,
		});
	} catch (error) {
		console.error("Workers AI inference failed", error);
		return jsonResponse({ error: "ai_inference_failed" }, 502);
	}
}

async function handleApi(request: Request, env: OmegaEnv): Promise<Response | null> {
	const url = new URL(request.url);

	if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
		const origin = request.headers.get("Origin");
		if (origin && !allowedOrigin(request, env)) {
			return jsonResponse({ error: "origin_not_allowed" }, 403);
		}
		return new Response(null, { status: 204, headers: corsHeaders(request, env) });
	}

	if (request.method === "GET" && url.pathname === "/api/v1/health") {
		return jsonResponse({
			ok: true,
			service: "omega-prime-edge-api",
			mode: env.OMEGA_MODE,
			workers_ai_bound: Boolean(env.AI),
			timestamp: new Date().toISOString(),
		});
	}

	if (request.method === "GET" && url.pathname === "/api/v1/status") {
		return jsonResponse({
			service: "ΩMEGA PRIME Δ Edge API",
			mode: env.OMEGA_MODE,
			live_trading_enabled: env.LIVE_TRADING_ENABLED === "true",
			ai_model: env.AI_MODEL,
			execution_authority: "external_aegis_and_execution_service_only",
			ai_execution_authority: false,
			timestamp: new Date().toISOString(),
		});
	}

	if (request.method === "POST" && url.pathname === "/api/v1/ai/stream") {
		return handleAiStream(request, env);
	}

	if (request.method === "POST" && url.pathname === "/api/v1/ai/generate") {
		return handleAiGenerate(request, env);
	}

	if (url.pathname.startsWith("/api/v1/")) {
		return jsonResponse({ error: "not_found" }, 404);
	}

	return null;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const apiResponse = await handleApi(request, env);
		if (apiResponse) return withCors(apiResponse, request, env);

		return requestHandler(request, {
			cloudflare: { env, ctx },
		});
	},
} satisfies ExportedHandler<OmegaEnv>;
