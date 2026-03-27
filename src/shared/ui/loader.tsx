import { motion } from 'framer-motion'

export const RingLoader = () => (
	<motion.svg
		animate={{ opacity: 1, scale: 1 }}
		className="absolute inset-0 m-auto h-21 w-21 stroke-blue-500"
		exit={{ opacity: 0, scale: 0.95 }}
		initial={{ opacity: 0, scale: 0.95 }}
		viewBox="0 0 45 45"
		xmlns="http://www.w3.org/2000/svg"
	>
		<g
			fill="none"
			fillRule="evenodd"
			strokeWidth="2"
			transform="translate(1 1)"
		>
			<circle cx="22" cy="22" r="6" strokeOpacity="0">
				<animate
					attributeName="r"
					begin="0s"
					calcMode="linear"
					dur="3s"
					repeatCount="indefinite"
					values="6;22"
				/>
				<animate
					attributeName="stroke-opacity"
					begin="0s"
					calcMode="linear"
					dur="3s"
					repeatCount="indefinite"
					values="1;0"
				/>
				<animate
					attributeName="stroke-width"
					begin="0s"
					calcMode="linear"
					dur="3s"
					repeatCount="indefinite"
					values="2;0"
				/>
			</circle>
			<circle cx="22" cy="22" r="6" strokeOpacity="0">
				<animate
					attributeName="r"
					begin="1.5s"
					calcMode="linear"
					dur="3s"
					repeatCount="indefinite"
					values="6;22"
				/>
				<animate
					attributeName="stroke-opacity"
					begin="1.5s"
					calcMode="linear"
					dur="3s"
					repeatCount="indefinite"
					values="1;0"
				/>
				<animate
					attributeName="stroke-width"
					begin="1.5s"
					calcMode="linear"
					dur="3s"
					repeatCount="indefinite"
					values="2;0"
				/>
			</circle>
			<circle cx="22" cy="22" r="8">
				<animate
					attributeName="r"
					begin="0s"
					calcMode="linear"
					dur="1.5s"
					repeatCount="indefinite"
					values="6;1;2;3;4;5;6"
				/>
			</circle>
		</g>
	</motion.svg>
)
