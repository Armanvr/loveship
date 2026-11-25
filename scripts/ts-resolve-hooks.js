// Hook de résolution Node : `import './x.js'` retombe sur `./x.ts` quand le .js n'existe pas.
// Le code serveur importe avec l'extension .js (exigence ESM de Vercel) alors que les sources sont en .ts.
export async function resolve(specifier, context, nextResolve) {
	try {
		return await nextResolve(specifier, context)
	} catch (error) {
		if (error?.code === 'ERR_MODULE_NOT_FOUND' && /^\.{1,2}\/.+\.js$/.test(specifier)) {
			return nextResolve(specifier.replace(/\.js$/, '.ts'), context)
		}
		throw error
	}
}
