// Composition du bouquet dans un repère 600 x 800 : données pures, partagées par la scène SVG et l'export Canvas.

export const VIEW = { w: 600, h: 800 } as const
export const BOUQUET_ASPECT = VIEW.w / VIEW.h

export interface Flower {
	/** Centre de l'image dans le repère du bouquet. */
	cx: number
	cy: number
	/** Côté du carré dans lequel l'image est ajustée. */
	size: number
	/** Rotation finale (degrés) autour du centre. */
	tilt: number
}

export const FLOWERS = {
	lily: { cx: 188, cy: 232, size: 330, tilt: -4 },
	gerbera: { cx: 412, cy: 300, size: 272, tilt: 6 },
} as const satisfies Record<string, Flower>

export interface Stroke {
	d: string
	color: string
	width: number
}

// Les tiges partent du centre des fleurs, s'entrecroisent deux fois, puis se séparent au pied du bouquet.
export const STEMS = {
	lily: {
		d: 'M188 240 C188 392 336 396 322 526 S 276 690 290 782',
		color: '#8c9a68',
		width: 5.5,
	},
	gerbera: {
		d: 'M412 308 C412 430 266 428 278 530 S 326 690 310 782',
		color: '#7a8b5d',
		width: 5.5,
	},
} as const satisfies Record<string, Stroke>

export const THREAD = {
	d: 'M192 338 C206 430 256 474 298 520 C330 556 330 598 298 606 C266 614 252 578 280 562 C312 546 346 576 334 614 C324 646 290 642 286 616 C296 566 346 482 408 392',
	color: '#c4a04c',
	width: 2.6,
} as const satisfies Stroke

/** Liseré aquarelle très léger qui détache le lys blanc de l'ivoire (σ en unités du repère). */
export const LILY_HALO = { dy: 1.5, sigma: 3, color: 'rgba(150, 118, 72, 0.38)' } as const
