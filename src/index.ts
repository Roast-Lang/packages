/**
 * Roast Package Registry - Cloudflare Workers
 * 
 * A complete package registry server for the Roast language.
 * Deploy to Cloudflare Workers with R2 for storage and KV for metadata.
 */

import { homePage, searchPage, packagePage, notFoundPage, docsPage } from './templates';

export interface Env {
    // KV Namespaces
    PACKAGES: KVNamespace;
    USERS: KVNamespace;
    TOKENS: KVNamespace;

    // R2 Bucket
    TARBALLS: R2Bucket;

    // Environment variables
    REGISTRY_NAME: string;
    REGISTRY_VERSION: string;

    // Secrets
    ADMIN_TOKEN?: string;
    JWT_SECRET?: string;
}

// Types
interface PackageVersion {
    version: string;
    published_at: string;
    yanked: boolean;
    checksum: string;
    size: number;
    download_url?: string;
    signature?: string;
    publisher_fingerprint?: string;
}

interface PackageMetadata {
    name: string;
    description: string;
    authors: string[];
    license: string;
    repository?: string;
    homepage?: string;
    keywords: string[];
    versions: PackageVersion[];
    created_at: string;
    updated_at: string;
    downloads: number;
}

interface User {
    id: string;
    email: string;
    name: string;
    created_at: string;
    packages: string[];
}

// Security headers for all responses
const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

const CSP_HEADER = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

// Utility functions
function jsonResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Package-Signature, X-Publisher-Fingerprint',
            ...SECURITY_HEADERS,
        },
    });
}

function htmlResponse(html: string, status = 200): Response {
    return new Response(html, {
        status,
        headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            'Content-Security-Policy': CSP_HEADER,
            ...SECURITY_HEADERS,
        },
    });
}

function errorResponse(message: string, status = 400): Response {
    return jsonResponse({ error: message }, status);
}

async function hashData(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyToken(token: string, env: Env): Promise<User | null> {
    if (!token) return null;

    // Check if it's the admin token
    if (env.ADMIN_TOKEN && token === env.ADMIN_TOKEN) {
        return {
            id: 'admin',
            email: 'admin@roast-lang.org',
            name: 'Admin',
            created_at: new Date().toISOString(),
            packages: [],
        };
    }

    // Look up token in KV
    const userId = await env.TOKENS.get(token);
    if (!userId) return null;

    const userJson = await env.USERS.get(userId);
    if (!userJson) return null;

    return JSON.parse(userJson) as User;
}

// API Handlers
async function handleGetPackage(name: string, env: Env): Promise<Response> {
    const metadataJson = await env.PACKAGES.get(`pkg:${name}`);

    if (!metadataJson) {
        return errorResponse(`Package '${name}' not found`, 404);
    }

    const metadata: PackageMetadata = JSON.parse(metadataJson);

    // Add download URLs for each version
    for (const version of metadata.versions) {
        version.download_url = `/api/v1/packages/${name}/${version.version}/download`;
    }

    // Increment download counter (async, don't wait)
    env.PACKAGES.put(`pkg:${name}`, JSON.stringify({
        ...metadata,
        downloads: metadata.downloads + 1,
    }));

    return jsonResponse(metadata);
}

async function handleSearchPackages(query: string, env: Env): Promise<Response> {
    const results: PackageMetadata[] = [];
    const queryLower = query.toLowerCase();

    // List all packages (in production, use a search index)
    const list = await env.PACKAGES.list({ prefix: 'pkg:' });

    for (const key of list.keys) {
        const metadataJson = await env.PACKAGES.get(key.name);
        if (!metadataJson) continue;

        const metadata: PackageMetadata = JSON.parse(metadataJson);

        // Simple search: check name, description, keywords
        if (
            metadata.name.toLowerCase().includes(queryLower) ||
            metadata.description.toLowerCase().includes(queryLower) ||
            metadata.keywords.some(k => k.toLowerCase().includes(queryLower))
        ) {
            results.push(metadata);
        }
    }

    return jsonResponse({ packages: results });
}

async function handleDownloadPackage(
    name: string,
    version: string,
    env: Env
): Promise<Response> {
    const metadataJson = await env.PACKAGES.get(`pkg:${name}`);

    if (!metadataJson) {
        return errorResponse(`Package '${name}' not found`, 404);
    }

    const metadata: PackageMetadata = JSON.parse(metadataJson);
    const versionInfo = metadata.versions.find(v => v.version === version);

    if (!versionInfo) {
        return errorResponse(`Version '${version}' not found for '${name}'`, 404);
    }

    if (versionInfo.yanked) {
        return errorResponse(`Version '${version}' has been yanked`, 410);
    }

    // Get tarball from R2
    const tarball = await env.TARBALLS.get(`${name}/${version}.tar.gz`);

    if (!tarball) {
        return errorResponse('Package tarball not found', 404);
    }

    return new Response(tarball.body, {
        headers: {
            'Content-Type': 'application/gzip',
            'Content-Disposition': `attachment; filename="${name}-${version}.tar.gz"`,
            'X-Checksum-SHA256': versionInfo.checksum,
        },
    });
}

async function handlePublishPackage(
    request: Request,
    env: Env
): Promise<Response> {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return errorResponse('Authentication required', 401);
    }

    const token = authHeader.slice(7);
    const user = await verifyToken(token, env);

    if (!user) {
        return errorResponse('Invalid authentication token', 401);
    }

    // Get tarball content
    const tarball = await request.arrayBuffer();

    if (tarball.byteLength === 0) {
        return errorResponse('Empty package tarball', 400);
    }

    // Extract package info from tarball
    // In a real implementation, we'd parse the tar.gz to get roast.toml
    // For now, expect metadata in headers or a separate endpoint
    const packageName = request.headers.get('X-Package-Name');
    const packageVersion = request.headers.get('X-Package-Version');
    const packageDescription = request.headers.get('X-Package-Description') || '';
    const signature = request.headers.get('X-Package-Signature');
    const fingerprint = request.headers.get('X-Publisher-Fingerprint');

    if (!packageName || !packageVersion) {
        return errorResponse('Missing X-Package-Name or X-Package-Version header', 400);
    }

    // Validate package name
    if (!/^[a-z][a-z0-9_-]*$/.test(packageName)) {
        return errorResponse('Invalid package name. Must start with lowercase letter and contain only lowercase letters, numbers, underscores, and hyphens.', 400);
    }

    // Validate version (semver-like)
    if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(packageVersion)) {
        return errorResponse('Invalid version format. Expected semver (e.g., 1.0.0)', 400);
    }

    // Calculate checksum
    const checksum = await hashData(tarball);

    // Get or create package metadata
    let metadata: PackageMetadata;
    const existingJson = await env.PACKAGES.get(`pkg:${packageName}`);

    if (existingJson) {
        metadata = JSON.parse(existingJson);

        // Check if version already exists
        if (metadata.versions.some(v => v.version === packageVersion)) {
            return errorResponse(`Version ${packageVersion} already exists`, 409);
        }
    } else {
        // New package
        metadata = {
            name: packageName,
            description: packageDescription,
            authors: [user.name],
            license: 'MIT',
            keywords: [],
            versions: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            downloads: 0,
        };
    }

    // Add new version
    const newVersion: PackageVersion = {
        version: packageVersion,
        published_at: new Date().toISOString(),
        yanked: false,
        checksum,
        size: tarball.byteLength,
        signature: signature || undefined,
        publisher_fingerprint: fingerprint || undefined,
    };

    metadata.versions.push(newVersion);
    metadata.versions.sort((a, b) => compareVersions(b.version, a.version));
    metadata.updated_at = new Date().toISOString();

    // Store tarball in R2
    await env.TARBALLS.put(`${packageName}/${packageVersion}.tar.gz`, tarball, {
        customMetadata: {
            checksum,
            publisher: user.id,
            published_at: newVersion.published_at,
        },
    });

    // Store metadata in KV
    await env.PACKAGES.put(`pkg:${packageName}`, JSON.stringify(metadata));

    // Update user's package list
    if (!user.packages.includes(packageName)) {
        user.packages.push(packageName);
        await env.USERS.put(user.id, JSON.stringify(user));
    }

    return jsonResponse({
        message: `Published ${packageName}@${packageVersion}`,
        checksum,
        download_url: `/api/v1/packages/${packageName}/${packageVersion}/download`,
    }, 201);
}

async function handleYankVersion(
    name: string,
    version: string,
    yank: boolean,
    request: Request,
    env: Env
): Promise<Response> {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return errorResponse('Authentication required', 401);
    }

    const token = authHeader.slice(7);
    const user = await verifyToken(token, env);

    if (!user) {
        return errorResponse('Invalid authentication token', 401);
    }

    const metadataJson = await env.PACKAGES.get(`pkg:${name}`);

    if (!metadataJson) {
        return errorResponse(`Package '${name}' not found`, 404);
    }

    const metadata: PackageMetadata = JSON.parse(metadataJson);
    const versionInfo = metadata.versions.find(v => v.version === version);

    if (!versionInfo) {
        return errorResponse(`Version '${version}' not found`, 404);
    }

    // Check ownership (admin can yank any package)
    if (user.id !== 'admin' && !user.packages.includes(name)) {
        return errorResponse('Not authorized to modify this package', 403);
    }

    versionInfo.yanked = yank;
    metadata.updated_at = new Date().toISOString();

    await env.PACKAGES.put(`pkg:${name}`, JSON.stringify(metadata));

    return jsonResponse({
        message: `${yank ? 'Yanked' : 'Unyanked'} ${name}@${version}`,
    });
}

async function handleListPackages(env: Env): Promise<Response> {
    const packages: { name: string; description: string; latest: string }[] = [];

    const list = await env.PACKAGES.list({ prefix: 'pkg:' });

    for (const key of list.keys) {
        const metadataJson = await env.PACKAGES.get(key.name);
        if (!metadataJson) continue;

        const metadata: PackageMetadata = JSON.parse(metadataJson);
        const latestVersion = metadata.versions.find(v => !v.yanked);

        packages.push({
            name: metadata.name,
            description: metadata.description,
            latest: latestVersion?.version || 'none',
        });
    }

    return jsonResponse({ packages });
}

async function handleRegisterUser(
    request: Request,
    env: Env
): Promise<Response> {
    const body = await request.json() as { email: string; name: string };

    if (!body.email || !body.name) {
        return errorResponse('Missing email or name', 400);
    }

    // Check if user already exists
    const existingUser = await env.USERS.get(`email:${body.email}`);
    if (existingUser) {
        return errorResponse('Email already registered', 409);
    }

    // Create user
    const userId = crypto.randomUUID();
    const apiToken = crypto.randomUUID();

    const user: User = {
        id: userId,
        email: body.email,
        name: body.name,
        created_at: new Date().toISOString(),
        packages: [],
    };

    // Store user
    await env.USERS.put(userId, JSON.stringify(user));
    await env.USERS.put(`email:${body.email}`, userId);

    // Store token
    await env.TOKENS.put(apiToken, userId);

    return jsonResponse({
        message: 'User registered successfully',
        user_id: userId,
        api_token: apiToken,
    }, 201);
}

// Version comparison helper
function compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(p => parseInt(p, 10) || 0);
    const partsB = b.split('.').map(p => parseInt(p, 10) || 0);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const partA = partsA[i] || 0;
        const partB = partsB[i] || 0;
        if (partA !== partB) return partA - partB;
    }

    return 0;
}

// Main request handler
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;

        // Handle CORS preflight
        if (method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Package-Name, X-Package-Version, X-Package-Description, X-Package-Signature, X-Publisher-Fingerprint',
                },
            });
        }

        try {
            // Static assets are served automatically by Wrangler from the public/ directory

            // ==========================================
            // WEB UI ROUTES (HTML pages)
            // ==========================================

            // GET / - Home page with package list
            if (path === '/' && method === 'GET') {
                const list = await env.PACKAGES.list({ prefix: 'pkg:' });
                const packages = [];
                let totalDownloads = 0;
                let totalVersions = 0;

                for (const key of list.keys) {
                    const metadataJson = await env.PACKAGES.get(key.name);
                    if (!metadataJson) continue;

                    const metadata = JSON.parse(metadataJson);
                    const latestVersion = metadata.versions.find((v: any) => !v.yanked);
                    totalDownloads += metadata.downloads || 0;
                    totalVersions += metadata.versions.length;

                    packages.push({
                        name: metadata.name,
                        description: metadata.description,
                        latest: latestVersion?.version || 'none',
                        downloads: metadata.downloads,
                        updated_at: metadata.updated_at,
                    });
                }

                const html = homePage({
                    packages,
                    stats: {
                        totalPackages: packages.length,
                        totalDownloads,
                        totalVersions,
                    },
                });

                return htmlResponse(html);
            }

            // GET /search - Search results page
            if (path === '/search' && method === 'GET') {
                const query = url.searchParams.get('q') || '';
                const queryLower = query.toLowerCase();
                const list = await env.PACKAGES.list({ prefix: 'pkg:' });
                const packages = [];

                for (const key of list.keys) {
                    const metadataJson = await env.PACKAGES.get(key.name);
                    if (!metadataJson) continue;

                    const metadata = JSON.parse(metadataJson);

                    if (
                        metadata.name.toLowerCase().includes(queryLower) ||
                        metadata.description.toLowerCase().includes(queryLower) ||
                        metadata.keywords.some((k: string) => k.toLowerCase().includes(queryLower))
                    ) {
                        const latestVersion = metadata.versions.find((v: any) => !v.yanked);
                        packages.push({
                            name: metadata.name,
                            description: metadata.description,
                            latest: latestVersion?.version || 'none',
                            downloads: metadata.downloads,
                        });
                    }
                }

                const html = searchPage({ packages, query });
                return htmlResponse(html);
            }

            // GET /docs - Documentation page
            if (path === '/docs' && method === 'GET') {
                const html = docsPage();
                return htmlResponse(html);
            }

            // GET /packages/:name - Package detail page
            const webPackageMatch = path.match(/^\/packages\/([^/]+)$/);
            if (webPackageMatch && method === 'GET') {
                const name = webPackageMatch[1];
                const metadataJson = await env.PACKAGES.get(`pkg:${name}`);

                if (!metadataJson) {
                    const html = notFoundPage();
                    return htmlResponse(html, 404);
                }

                const metadata = JSON.parse(metadataJson);
                const html = packagePage({ package: metadata });

                return htmlResponse(html);
            }

            // ==========================================
            // API v1 ROUTES (JSON)
            // ==========================================

            // GET /api/v1 - Registry info
            if (path === '/api/v1') {
                return jsonResponse({
                    name: env.REGISTRY_NAME,
                    version: env.REGISTRY_VERSION,
                    api: '/api/v1',
                    endpoints: {
                        packages: '/api/v1/packages',
                        search: '/api/v1/search?q=query',
                        publish: 'POST /api/v1/packages',
                        register: 'POST /api/v1/users/register',
                    },
                });
            }

            // GET /api/v1/packages - List all packages
            if (path === '/api/v1/packages' && method === 'GET') {
                return handleListPackages(env);
            }

            // POST /api/v1/packages - Publish package
            if (path === '/api/v1/packages' && method === 'POST') {
                return handlePublishPackage(request, env);
            }

            // GET /api/v1/packages/:name - Get package metadata
            const packageMatch = path.match(/^\/api\/v1\/packages\/([^/]+)$/);
            if (packageMatch && method === 'GET') {
                return handleGetPackage(packageMatch[1], env);
            }

            // GET /api/v1/packages/:name/:version/download - Download package
            const downloadMatch = path.match(/^\/api\/v1\/packages\/([^/]+)\/([^/]+)\/download$/);
            if (downloadMatch && method === 'GET') {
                return handleDownloadPackage(downloadMatch[1], downloadMatch[2], env);
            }

            // POST /api/v1/packages/:name/:version/yank - Yank version
            const yankMatch = path.match(/^\/api\/v1\/packages\/([^/]+)\/([^/]+)\/yank$/);
            if (yankMatch && method === 'POST') {
                return handleYankVersion(yankMatch[1], yankMatch[2], true, request, env);
            }

            // POST /api/v1/packages/:name/:version/unyank - Unyank version
            const unyankMatch = path.match(/^\/api\/v1\/packages\/([^/]+)\/([^/]+)\/unyank$/);
            if (unyankMatch && method === 'POST') {
                return handleYankVersion(unyankMatch[1], unyankMatch[2], false, request, env);
            }

            // GET /api/v1/search - Search packages
            if (path === '/api/v1/search' && method === 'GET') {
                const query = url.searchParams.get('q') || '';
                return handleSearchPackages(query, env);
            }

            // POST /api/v1/users/register - Register user
            if (path === '/api/v1/users/register' && method === 'POST') {
                return handleRegisterUser(request, env);
            }

            // 404 for unknown routes
            const html = notFoundPage();
            return htmlResponse(html, 404);

        } catch (error) {
            console.error('Error:', error);
            return errorResponse(`Internal server error: ${error}`, 500);
        }
    },
};
