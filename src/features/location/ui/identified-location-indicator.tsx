import { Trans } from '@lingui/react/macro'
import { IconMapPin } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useId, useState } from 'react'
import { z } from 'zod'

import { AsyncStatus } from '../../../shared/hooks/async-status'
import {
	readLocalStorage,
	writeLocalStorage,
} from '../../../shared/lib/local-storage'
import { useIdentifiedLocation } from '../hooks/use-identified-location'

const LOCATION_EXPANDED_STORAGE_KEY = 'weather-please:location-expanded'
const locationExpandedSchema = z.boolean()

interface IdentifiedLocationIndicatorProps {
	lat: string
	locale: string
	lon: string
}

export const IdentifiedLocationIndicator = ({
	lat,
	locale,
	lon,
}: Readonly<IdentifiedLocationIndicatorProps>) => {
	const { hasResolved, label, status } = useIdentifiedLocation({
		lat,
		locale,
		lon,
	})
	const [isExpanded, setIsExpanded] = useState(getInitialIsExpanded)
	const buttonLabelId = useId()
	const contentId = useId()
	const locationContent =
		status === AsyncStatus.Error || !label ? (
			<Trans>Location name unavailable</Trans>
		) : (
			label
		)

	const handleToggle = () => {
		const nextIsExpanded = !isExpanded
		setIsExpanded(nextIsExpanded)
		writeLocalStorage({
			key: LOCATION_EXPANDED_STORAGE_KEY,
			value: JSON.stringify(nextIsExpanded),
		})
	}

	if (!lat || !lon || !hasResolved) {
		return null
	}

	return (
		<motion.div
			animate={{
				opacity: 1,
				scale: 1,
				transition: {
					delay: 0.1,
					duration: 2,
					type: 'spring',
				},
			}}
			className="w-fit"
			initial={{ opacity: 0, scale: 0.98 }}
		>
			<motion.button
				aria-controls={contentId}
				aria-describedby={isExpanded ? contentId : undefined}
				aria-expanded={isExpanded}
				aria-labelledby={buttonLabelId}
				className="flex w-fit max-w-[calc(100vw-6rem)] cursor-pointer items-center rounded-full border border-white/10 bg-dark-950/78 px-3 py-1.5 text-left text-xs font-medium text-white shadow-sm backdrop-blur-md transition-colors hover:bg-dark-950/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
				onClick={handleToggle}
				title={`${lat}, ${lon}`}
				type="button"
			>
				<IconMapPin
					aria-hidden
					className="shrink-0 text-blue-300"
					size={12}
					strokeWidth={2}
				/>
				<span className="sr-only" id={buttonLabelId}>
					<Trans>Location</Trans>
				</span>
				<motion.span
					animate={{
						marginLeft: isExpanded ? 8 : 0,
						opacity: isExpanded ? 1 : 0,
						width: isExpanded ? 'auto' : 0,
					}}
					aria-hidden={!isExpanded}
					className="min-w-0 overflow-hidden whitespace-nowrap"
					id={contentId}
					initial={false}
					transition={{
						damping: 32,
						opacity: { duration: 0.2 },
						stiffness: 360,
						type: 'spring',
					}}
				>
					<span className="block truncate">{locationContent}</span>
				</motion.span>
			</motion.button>
		</motion.div>
	)
}

const getInitialIsExpanded = (): boolean => {
	const storedValue = readLocalStorage(LOCATION_EXPANDED_STORAGE_KEY)
	if (!storedValue) return true

	try {
		const parsed = locationExpandedSchema.safeParse(JSON.parse(storedValue))
		return parsed.success ? parsed.data : true
	} catch {
		return true
	}
}
