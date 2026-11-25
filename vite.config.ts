import { existsSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'

type Handler = (request: Request) => Response | Promise<Response>

function toWebRequest(req: IncomingMessage): Request {
	const method = req.method ?? 'GET'
	const headers = new Headers()
	for (const [name, value] of Object.entries(req.headers)) {
		if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value)
	}
	const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
	const body = method === 'GET' || method === 'HEAD' ? undefined : (Readable.toWeb(req) as ReadableStream)
	return new Request(url, { method, headers, body, duplex: 'half' })
}

async function sendWebResponse(response: Response, res: ServerResponse): Promise<void> {
	res.statusCode = response.status
	for (const [name, value] of response.headers) if (name !== 'set-cookie') res.setHeader(name, value)
	const cookies = response.headers.getSetCookie()
	if (cookies.length > 0) res.setHeader('set-cookie', cookies)
	if (!response.body) return void res.end()
	// pipeline propage le streaming (audio) et s'arrête proprement si le client coupe.
	await pipeline(Readable.fromWeb(response.body), res)
}

// Développement local uniquement (`apply: 'serve'`) : exécute les vraies Functions de api/ sans `vercel dev`.
// L'authentification reste réelle ; rien de ce plugin n'existe dans le build.
function localApi(): Plugin {
	return {
		name: 'loveship-local-api',
		apply: 'serve',
		configureServer(server) {
			const root = server.config.root
			// Les Functions lisent process.env : on y charge .env.local sans écraser l'environnement existant.
			const env = loadEnv(server.config.mode, server.config.envDir || root, '')
			for (const [key, value] of Object.entries(env)) process.env[key] ??= value

			server.middlewares.use(async (req, res, next) => {
				const { pathname } = new URL(req.url ?? '/', 'http://localhost')
				if (!pathname.startsWith('/api/')) return next()
				// Même routage que vercel.json : /api/assets/:id -> api/assets.ts ; les fichiers `_*` sont ignorés.
				const route = pathname.startsWith('/api/assets/')
					? 'assets'
					: /^\/api\/([a-z0-9-]+(?:\/[a-z0-9-]+)*)$/.exec(pathname)?.[1]
				const file = route && resolve(root, 'api', `${route}.ts`)
				try {
					if (!file || !existsSync(file))
						return await sendWebResponse(Response.json({ error: 'not_found' }, { status: 404 }), res)
					const handler = ((await server.ssrLoadModule(file)) as Record<string, Handler | undefined>)[
						req.method ?? 'GET'
					]
					if (!handler) return await sendWebResponse(new Response(null, { status: 405 }), res)
					await sendWebResponse(await handler(toWebRequest(req)), res)
				} catch (error) {
					if (error instanceof Error) server.ssrFixStacktrace(error)
					console.error('[api]', error)
					if (!res.headersSent)
						await sendWebResponse(Response.json({ error: 'server_error' }, { status: 500 }), res)
				}
			})
		},
	}
}

export default defineConfig({
	plugins: [preact(), tailwindcss(), localApi()],
})
