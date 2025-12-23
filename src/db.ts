/**
 * Database layer for Turso (libSQL)
 * Provides typed query functions for the registry
 */

import { createClient, Client } from '@libsql/client/web';

export interface Env {
    TURSO_DATABASE_URL: string;
    TURSO_AUTH_TOKEN: string;
}

export function createDb(env: Env): Client {
    return createClient({
        url: env.TURSO_DATABASE_URL,
        authToken: env.TURSO_AUTH_TOKEN,
    });
}

// Types
export interface PackageRow {
    name: string;
    description: string;
    authors: string;
    license: string;
    repository: string | null;
    homepage: string | null;
    keywords: string;
    downloads: number;
    created_at: string;
    updated_at: string;
}

export interface VersionRow {
    id: number;
    package_name: string;
    version: string;
    published_at: string;
    yanked: number;
    checksum: string;
    size: number;
    signature: string | null;
    publisher_fingerprint: string | null;
}

export interface UserRow {
    id: string;
    email: string;
    name: string;
    created_at: string;
}

export interface TokenRow {
    token: string;
    user_id: string;
    created_at: string;
}

// Package queries
export async function getPackage(db: Client, name: string): Promise<PackageRow | null> {
    const result = await db.execute({
        sql: 'SELECT * FROM packages WHERE name = ?',
        args: [name],
    });
    return result.rows[0] as PackageRow | undefined ?? null;
}

export async function getPackageVersions(db: Client, packageName: string): Promise<VersionRow[]> {
    const result = await db.execute({
        sql: 'SELECT * FROM versions WHERE package_name = ? ORDER BY published_at DESC',
        args: [packageName],
    });
    return result.rows as unknown as VersionRow[];
}

export async function getAllPackages(db: Client): Promise<PackageRow[]> {
    const result = await db.execute('SELECT * FROM packages ORDER BY updated_at DESC');
    return result.rows as unknown as PackageRow[];
}

export async function searchPackages(db: Client, query: string): Promise<PackageRow[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    const result = await db.execute({
        sql: `SELECT * FROM packages 
              WHERE LOWER(name) LIKE ? 
              OR LOWER(description) LIKE ? 
              OR LOWER(keywords) LIKE ?
              ORDER BY downloads DESC`,
        args: [searchTerm, searchTerm, searchTerm],
    });
    return result.rows as unknown as PackageRow[];
}

export async function createPackage(db: Client, pkg: Omit<PackageRow, 'downloads'>): Promise<void> {
    await db.execute({
        sql: `INSERT INTO packages (name, description, authors, license, repository, homepage, keywords, downloads, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        args: [pkg.name, pkg.description, pkg.authors, pkg.license, pkg.repository, pkg.homepage, pkg.keywords, pkg.created_at, pkg.updated_at],
    });
}

export async function updatePackage(db: Client, name: string, updates: Partial<PackageRow>): Promise<void> {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.authors !== undefined) { fields.push('authors = ?'); values.push(updates.authors); }
    if (updates.license !== undefined) { fields.push('license = ?'); values.push(updates.license); }
    if (updates.repository !== undefined) { fields.push('repository = ?'); values.push(updates.repository); }
    if (updates.homepage !== undefined) { fields.push('homepage = ?'); values.push(updates.homepage); }
    if (updates.keywords !== undefined) { fields.push('keywords = ?'); values.push(updates.keywords); }
    if (updates.downloads !== undefined) { fields.push('downloads = ?'); values.push(updates.downloads); }
    if (updates.updated_at !== undefined) { fields.push('updated_at = ?'); values.push(updates.updated_at); }

    if (fields.length === 0) return;

    values.push(name);
    await db.execute({
        sql: `UPDATE packages SET ${fields.join(', ')} WHERE name = ?`,
        args: values,
    });
}

export async function incrementDownloads(db: Client, name: string): Promise<void> {
    await db.execute({
        sql: 'UPDATE packages SET downloads = downloads + 1 WHERE name = ?',
        args: [name],
    });
}

// Version queries
export async function createVersion(db: Client, version: Omit<VersionRow, 'id'>): Promise<void> {
    await db.execute({
        sql: `INSERT INTO versions (package_name, version, published_at, yanked, checksum, size, signature, publisher_fingerprint)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [version.package_name, version.version, version.published_at, version.yanked, version.checksum, version.size, version.signature, version.publisher_fingerprint],
    });
}

export async function getVersion(db: Client, packageName: string, version: string): Promise<VersionRow | null> {
    const result = await db.execute({
        sql: 'SELECT * FROM versions WHERE package_name = ? AND version = ?',
        args: [packageName, version],
    });
    return result.rows[0] as VersionRow | undefined ?? null;
}

export async function setVersionYanked(db: Client, packageName: string, version: string, yanked: boolean): Promise<void> {
    await db.execute({
        sql: 'UPDATE versions SET yanked = ? WHERE package_name = ? AND version = ?',
        args: [yanked ? 1 : 0, packageName, version],
    });
}

// User queries
export async function getUser(db: Client, id: string): Promise<UserRow | null> {
    const result = await db.execute({
        sql: 'SELECT * FROM users WHERE id = ?',
        args: [id],
    });
    return result.rows[0] as UserRow | undefined ?? null;
}

export async function getUserByEmail(db: Client, email: string): Promise<UserRow | null> {
    const result = await db.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [email],
    });
    return result.rows[0] as UserRow | undefined ?? null;
}

export async function createUser(db: Client, user: UserRow): Promise<void> {
    await db.execute({
        sql: 'INSERT INTO users (id, email, name, created_at) VALUES (?, ?, ?, ?)',
        args: [user.id, user.email, user.name, user.created_at],
    });
}

export async function getUserPackages(db: Client, userId: string): Promise<string[]> {
    const result = await db.execute({
        sql: 'SELECT package_name FROM user_packages WHERE user_id = ?',
        args: [userId],
    });
    return result.rows.map(r => (r as { package_name: string }).package_name);
}

export async function addUserPackage(db: Client, userId: string, packageName: string): Promise<void> {
    await db.execute({
        sql: 'INSERT OR IGNORE INTO user_packages (user_id, package_name) VALUES (?, ?)',
        args: [userId, packageName],
    });
}

export async function userOwnsPackage(db: Client, userId: string, packageName: string): Promise<boolean> {
    const result = await db.execute({
        sql: 'SELECT 1 FROM user_packages WHERE user_id = ? AND package_name = ?',
        args: [userId, packageName],
    });
    return result.rows.length > 0;
}

// Token queries
export async function getUserByToken(db: Client, token: string): Promise<UserRow | null> {
    const result = await db.execute({
        sql: `SELECT u.* FROM users u 
              JOIN tokens t ON u.id = t.user_id 
              WHERE t.token = ?`,
        args: [token],
    });
    return result.rows[0] as UserRow | undefined ?? null;
}

export async function createToken(db: Client, token: string, userId: string): Promise<void> {
    await db.execute({
        sql: 'INSERT INTO tokens (token, user_id, created_at) VALUES (?, ?, ?)',
        args: [token, userId, new Date().toISOString()],
    });
}

// Stats
export async function getStats(db: Client): Promise<{ totalPackages: number; totalDownloads: number; totalVersions: number }> {
    const [packagesResult, downloadsResult, versionsResult] = await Promise.all([
        db.execute('SELECT COUNT(*) as count FROM packages'),
        db.execute('SELECT SUM(downloads) as total FROM packages'),
        db.execute('SELECT COUNT(*) as count FROM versions'),
    ]);

    return {
        totalPackages: Number((packagesResult.rows[0] as { count: number }).count) || 0,
        totalDownloads: Number((downloadsResult.rows[0] as { total: number }).total) || 0,
        totalVersions: Number((versionsResult.rows[0] as { count: number }).count) || 0,
    };
}
