// Usage : npm run hash-password   (saisie masquée)   ou   printf '%s' "$MOT_DE_PASSE" | npm run hash-password
// Le mot de passe n'est lu que sur stdin : jamais en argument, jamais affiché.
import { hashPassword, MAX_PASSWORD_LENGTH } from '../server/auth/password.js'

async function readPipedStdin(): Promise<string> {
	const chunks: Buffer[] = []
	for await (const chunk of process.stdin) chunks.push(chunk as Buffer)
	return Buffer.concat(chunks)
		.toString('utf8')
		.replace(/\r?\n$/, '')
}

function readHiddenStdin(): Promise<string> {
	process.stderr.write('Mot de passe (saisie masquée) : ')
	const { stdin } = process
	stdin.setRawMode(true)
	stdin.setEncoding('utf8')
	stdin.resume()
	return new Promise((done) => {
		let value = ''
		stdin.on('data', (chunk: string) => {
			for (const char of chunk) {
				if (char === '\u0003') process.exit(130)
				if (char === '\r' || char === '\n' || char === '\u0004') {
					stdin.setRawMode(false)
					stdin.pause()
					process.stderr.write('\n')
					return done(value)
				}
				value = char === '\u007f' ? value.slice(0, -1) : value + char
			}
		})
	})
}

const password = process.stdin.isTTY ? await readHiddenStdin() : await readPipedStdin()
if (password.length === 0 || password.length > MAX_PASSWORD_LENGTH) {
	console.error(`Le mot de passe doit contenir entre 1 et ${MAX_PASSWORD_LENGTH} caractères.`)
	process.exit(1)
}
console.log(`LOVESHIP_PASSWORD_HASH=${await hashPassword(password)}`)
