import { motion } from 'framer-motion'

export const RingLoader = () => (
	<motion.svg
		initial={{ scale: 0.95, opacity: 0 }}
		animate={{ scale: 1, opacity: 1 }}
		exit={{ scale: 0.95, opacity: 0 }}
		viewBox="0 0 45 45"
		xmlns="http://www.w3.org/2000/svg"
		className="absolute inset-0 m-auto h-[84px] w-[84px] stroke-blue-500"
	>
		<g
			fill="none"
			fillRule="evenodd"
			transform="translate(1 1)"
			strokeWidth="2"
		>
			<circle cx="22" cy="22" r="6" strokeOpacity="0">
				<animate
					attributeName="r"
					begin="0s"
					dur="3s"
					values="6;22"
					calcMode="linear"
					repeatCount="indefinite"
				/>
				<animate
					attributeName="stroke-opacity"
					begin="0s"
					dur="3s"
					values="1;0"
					calcMode="linear"
					repeatCount="indefinite"
				/>
				<animate
					attributeName="stroke-width"
					begin="0s"
					dur="3s"
					values="2;0"
					calcMode="linear"
					repeatCount="indefinite"
				/>
			</circle>
			<circle cx="22" cy="22" r="6" strokeOpacity="0">
				<animate
					attributeName="r"
					begin="1.5s"
					dur="3s"
					values="6;22"
					calcMode="linear"
					repeatCount="indefinite"
				/>
				<animate
					attributeName="stroke-opacity"
					begin="1.5s"
					dur="3s"
					values="1;0"
					calcMode="linear"
					repeatCount="indefinite"
				/>
				<animate
					attributeName="stroke-width"
					begin="1.5s"
					dur="3s"
					values="2;0"
					calcMode="linear"
					repeatCount="indefinite"
				/>
			</circle>
			<circle cx="22" cy="22" r="8">
				<animate
					attributeName="r"
					begin="0s"
					dur="1.5s"
					values="6;1;2;3;4;5;6"
					calcMode="linear"
					repeatCount="indefinite"
				/>
			</circle>
		</g>
	</motion.svg>
)
