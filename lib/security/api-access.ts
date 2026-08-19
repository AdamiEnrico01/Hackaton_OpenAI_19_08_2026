import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const DEFAULT_MAX_BODY_BYTES = 16_384;

type JsonBodyResult =
  | { data: unknown; error: null }
  | { data: null; error: NextResponse };

function secretsMatch(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return receivedBuffer.length === expectedBuffer.length
    && timingSafeEqual(receivedBuffer, expectedBuffer);
}

function isHostedEnvironment() {
  return Boolean(process.env.VERCEL_ENV) || process.env.NODE_ENV === "production";
}

export function protectPaidApi(request: Request) {
  const expectedToken = process.env.CRIA_TEST_TOKEN;
  if (!expectedToken && !isHostedEnvironment()) return null;

  const authorization = request.headers.get("authorization") ?? "";
  const receivedToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!expectedToken || !receivedToken || !secretsMatch(receivedToken, expectedToken)) {
    return NextResponse.json({ error: "Acesso de teste não autorizado." }, { status: 401 });
  }

  return null;
}

export async function readLimitedJson(
  request: Request,
  maxBodyBytes = DEFAULT_MAX_BODY_BYTES,
): Promise<JsonBodyResult> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return {
      data: null,
      error: NextResponse.json({ error: "Envie o pedido como application/json." }, { status: 415 }),
    };
  }

  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isSafeInteger(contentLength) || contentLength < 0) {
      return { data: null, error: NextResponse.json({ error: "Content-Length inválido." }, { status: 400 }) };
    }
    if (contentLength > maxBodyBytes) {
      return { data: null, error: NextResponse.json({ error: "Pedido grande demais." }, { status: 413 }) };
    }
  }

  if (!request.body) return { data: null, error: null };

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let raw = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;
    if (bytesRead > maxBodyBytes) {
      await reader.cancel();
      return { data: null, error: NextResponse.json({ error: "Pedido grande demais." }, { status: 413 }) };
    }
    raw += decoder.decode(value, { stream: true });
  }
  raw += decoder.decode();

  try {
    return { data: JSON.parse(raw), error: null };
  } catch {
    return { data: null, error: null };
  }
}

export function safeErrorName(error: unknown) {
  return error instanceof Error ? error.name : "UnknownError";
}
