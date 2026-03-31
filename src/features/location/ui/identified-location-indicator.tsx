import { Trans } from '@lingui/react/macro'
import { IconMapPin } from '@tabler/icons-react'
import { motion } from 'framer-motion'

import { AsyncStatus } from '../../../shared/hooks/async-status'
import { useIdentifiedLocation } from '../hooks/use-identified-location'

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
			className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-dark-950/78 px-3 py-1.5 text-xs font-medium text-white shadow-sm backdrop-blur-md"
			initial={{ opacity: 0, scale: 0.98 }}
			title={`${lat}, ${lon}`}
		>
			<IconMapPin
				aria-hidden
				className="shrink-0 text-blue-300"
				size={12}
				strokeWidth={2}
			/>
			{status === AsyncStatus.Error || !label ? (
				<span className="truncate">
					<Trans>Location name unavailable</Trans>
				</span>
			) : (
				<span className="truncate">{label}</span>
			)}
		</motion.div>
	)
}
