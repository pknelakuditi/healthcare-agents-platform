import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { RuntimeConfig } from '../../config/src/index.js';
import type { ReplayProtectionRepository } from '../../perimeter/src/index.js';

export class ApiAuthenticationRequiredError extends Error {
  constructor() {
    super('API authentication is required.');
    this.name = 'ApiAuthenticationRequiredError';
  }
}

export class ApiAuthenticationError extends Error {
  constructor(message = 'API authentication failed.') {
    super(message);
    this.name = 'ApiAuthenticationError';
  }
}

export type AuthenticatedApiClient = {
  clientId: string;
  authenticationMode: RuntimeConfig['apiAuthenticationMode'];
  actorId?: string;
  scopes?: string[];
};

function extractBearerToken(authorizationHeader?: string): string | undefined {
  if (!authorizationHeader) {
    return undefined;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return undefined;
  }

  return token.trim();
}

function constantTimeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function normalizeHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function createRequestBodyDigest(body: unknown): string {
  if (body === undefined || body === null || body === '') {
    return createHash('sha256').update('').digest('hex');
  }

  const normalizedBody = typeof body === 'string' ? body : JSON.stringify(body);
  return createHash('sha256').update(normalizedBody).digest('hex');
}

function buildSignaturePayload(input: {
  method: string;
  path: string;
  timestamp: string;
  nonce: string;
  bodyDigest: string;
}): string {
  return [input.method.toUpperCase(), input.path, input.timestamp, input.nonce, input.bodyDigest].join('\n');
}

function authenticateSharedKey(
  clientId: string | undefined,
  headers: Record<string, string | string[] | undefined>,
  config: RuntimeConfig,
): AuthenticatedApiClient {
  const apiKeyFromHeader = normalizeHeaderValue(headers['x-api-key']);
  const bearerToken = extractBearerToken(normalizeHeaderValue(headers.authorization));
  const apiKey = apiKeyFromHeader ?? bearerToken;

  if (!clientId || !apiKey) {
    throw new ApiAuthenticationRequiredError();
  }

  const credential = config.apiClients.find((item) => item.clientId === clientId);
  if (!credential || !constantTimeEquals(apiKey, credential.apiKey)) {
    throw new ApiAuthenticationError();
  }

  return {
    clientId,
    authenticationMode: 'shared-key',
  };
}

function authenticateHmacSignature(
  clientId: string | undefined,
  headers: Record<string, string | string[] | undefined>,
  config: RuntimeConfig,
  request: {
    method: string;
    path: string;
    body: unknown;
  },
  replayProtectionRepository: ReplayProtectionRepository,
): AuthenticatedApiClient {
  const timestamp = normalizeHeaderValue(headers['x-timestamp']);
  const providedSignature = normalizeHeaderValue(headers['x-signature']);
  const nonce = normalizeHeaderValue(headers['x-nonce']);

  if (!clientId || !timestamp || !providedSignature || !nonce) {
    throw new ApiAuthenticationRequiredError();
  }

  const credential = config.apiClients.find((item) => item.clientId === clientId);
  if (!credential) {
    throw new ApiAuthenticationError();
  }

  const requestTimestamp = Number(timestamp);
  if (!Number.isFinite(requestTimestamp)) {
    throw new ApiAuthenticationError('API request signature timestamp is invalid.');
  }

  const ageSeconds = Math.abs(Date.now() - requestTimestamp) / 1000;
  if (ageSeconds > config.maxRequestSignatureAgeSeconds) {
    throw new ApiAuthenticationError('API request signature has expired.');
  }

  const replayKey = `${clientId}:${nonce}`;
  if (!replayProtectionRepository.claim(replayKey, Date.now(), config.maxRequestSignatureAgeSeconds)) {
    throw new ApiAuthenticationError('API request signature nonce has already been used.');
  }

  const bodyDigest = createRequestBodyDigest(request.body);
  const expectedSignature = createHmac('sha256', credential.apiKey)
    .update(buildSignaturePayload({
      method: request.method,
      path: request.path,
      timestamp,
      nonce,
      bodyDigest,
    }))
    .digest('hex');

  if (!constantTimeEquals(providedSignature, expectedSignature)) {
    throw new ApiAuthenticationError();
  }

  return {
    clientId,
    authenticationMode: 'hmac-signature',
  };
}

function authenticateGatewayAssertion(
  headers: Record<string, string | string[] | undefined>,
  config: RuntimeConfig,
): AuthenticatedApiClient {
  const gatewaySecret = normalizeHeaderValue(headers['x-gateway-auth']);
  const clientId = normalizeHeaderValue(headers['x-authenticated-client-id']);
  const actorId = normalizeHeaderValue(headers['x-authenticated-user-id']);
  const scopesHeader = normalizeHeaderValue(headers['x-authenticated-scopes']);

  if (!gatewaySecret || !clientId || !actorId) {
    throw new ApiAuthenticationRequiredError();
  }

  if (!config.gatewaySharedSecret || !constantTimeEquals(gatewaySecret, config.gatewaySharedSecret)) {
    throw new ApiAuthenticationError();
  }

  return {
    clientId,
    actorId,
    scopes: scopesHeader
      ? scopesHeader.split(',').map((item) => item.trim()).filter(Boolean)
      : [],
    authenticationMode: 'gateway-asserted',
  };
}

export function authenticateApiClient(
  headers: Record<string, string | string[] | undefined>,
  config: RuntimeConfig,
  request: {
    method: string;
    path: string;
    body: unknown;
  },
  replayProtectionRepository: ReplayProtectionRepository,
): AuthenticatedApiClient | null {
  if (!config.requireApiAuthentication) {
    return null;
  }

  if (config.apiAuthenticationMode === 'hmac-signature') {
    const clientId = normalizeHeaderValue(headers['x-client-id']);
    return authenticateHmacSignature(clientId, headers, config, request, replayProtectionRepository);
  }

  if (config.apiAuthenticationMode === 'gateway-asserted') {
    return authenticateGatewayAssertion(headers, config);
  }

  const clientId = normalizeHeaderValue(headers['x-client-id']);
  return authenticateSharedKey(clientId, headers, config);
}
