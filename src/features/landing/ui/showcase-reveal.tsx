'use client'

import type { ReactNode } from 'react'

import { clsx } from 'clsx'
import { motion } from 'framer-motion'

export const ShowcaseReveal = ({
	children,
	className,
}: Readonly<{ children: ReactNode; className: string }>) => (
	<motion.section
		className={clsx(
			className,
			'motion-reduce:opacity-100! motion-reduce:transform-none!',
		)}
		initial={{ opacity: 0, y: 24 }}
		transition={{ duration: 0.6, ease: 'easeOut' }}
		viewport={{ amount: 0.25, once: true }}
		whileInView={{ opacity: 1, y: 0 }}
	>
		{children}
	</motion.section>
)
