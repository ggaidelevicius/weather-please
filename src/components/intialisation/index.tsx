import { locales } from '@/util/i18n'
import { Trans } from '@lingui/react/macro'
import {
	IconInfoCircleFilled,
	IconShieldCheckFilled,
} from '@tabler/icons-react'
import Image from 'next/image'
import { useState } from 'react'
import Favicon from '../../../public/favicon.png'
import alertStyles from '../alert/styles.module.css'
import type { InitialisationProps } from './types'
import {
	Description,
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from '@headlessui/react'
import { Select } from '../input'
import Alert from '../alert'

const Initialisation = ({
	opened,
	geolocationError,
	handleClick,
	input,
	handleChange,
	close,
}: InitialisationProps) => {
	const [isOpen, setIsOpen] = useState(false)

	const [loading, setLoading] = useState<boolean>(false)

	return (
		// <Modal
		// 	opened={opened}
		// 	onClose={close}
		// 	centered
		// 	size="auto"
		// 	padding="lg"
		// 	radius="md"
		// 	closeOnClickOutside={false}
		// 	closeOnEscape={false}
		// 	withCloseButton={false}
		// 	trapFocus={false}
		// >
		// 	<div
		// 		style={{
		// 			display: 'flex',
		// 			gap: '0.75rem',
		// 			alignItems: 'center',
		// 			marginBottom: '2rem',
		// 			justifyContent: 'center',
		// 		}}
		// 	>
		// 		<Image
		// 			priority
		// 			quality={100}
		// 			src={Favicon}
		// 			alt="Weather Please logo"
		// 			style={{ height: '4rem', width: '4rem' }}
		// 		/>
		// 		<Title order={1}>
		// 			Weather <span style={{ color: '#ea5e57' }}>Please</span>
		// 		</Title>
		// 	</div>
		// 	<Text style={{ fontSize: '1.05rem' }}>
		// 		<Trans>
		// 			To get started, let&apos;s set your language and location.
		// 		</Trans>
		// 	</Text>
		// 	{!geolocationError && (
		// 		<>
		// 			<Text c="dimmed" size="sm">
		// 				<Trans>
		// 					If your browser prompts you for location permissions, please
		// 					select &quot;allow&quot;.
		// 				</Trans>
		// 			</Text>
		// 			<NativeSelect
		// 				mt="xs"
		// 				label={<Trans>Language</Trans>}
		// 				value={input.lang}
		// 				onChange={(e) => {
		// 					handleChange('lang', e.target.value)
		// 				}}
		// 				data={Object.keys(locales).map((key) => ({
		// 					label: locales[key].label,
		// 					value: key,
		// 				}))}
		// 			/>
		// 			<Alert
		// 				className={alertStyles.alert}
		// 				radius="md"
		// 				color="green"
		// 				styles={{
		// 					message: {
		// 						display: 'flex',
		// 						alignItems: 'center',
		// 						gap: '0.75rem',
		// 						justifyContent: 'flex-start',
		// 					},
		// 				}}
		// 				mt="md"
		// 			>
		// 				<IconShieldCheckFilled size={30} strokeWidth={1.5} aria-hidden />
		// 				<span style={{ width: 'calc(100% - 30px - 0.75rem)' }}>
		// 					<Trans>
		// 						Your location data is securely stored exclusively on your
		// 						personal device.
		// 					</Trans>
		// 				</span>
		// 			</Alert>
		// 			<Alert
		// 				className={alertStyles.alert}
		// 				radius="md"
		// 				color="blue"
		// 				styles={{
		// 					message: {
		// 						display: 'flex',
		// 						alignItems: 'center',
		// 						gap: '0.75rem',
		// 						justifyContent: 'flex-start',
		// 					},
		// 				}}
		// 				mt="md"
		// 			>
		// 				<IconInfoCircleFilled size={30} strokeWidth={1.5} aria-hidden />
		// 				<span style={{ width: 'calc(100% - 30px - 0.75rem)' }}>
		// 					<Trans>
		// 						Weather Please collects anonymised crash data and error logs.
		// 						You can opt out of this at any time via the settings menu.
		// 					</Trans>
		// 				</span>
		// 			</Alert>
		// 			<Button
		// 				onClick={() => {
		// 					handleClick('auto')
		// 					setLoading(true)
		// 				}}
		// 				mt="md"
		// 				fullWidth
		// 				loading={loading}
		// 			>
		// 				<Trans>Set my location</Trans>
		// 			</Button>
		// 		</>
		// 	)}
		// 	{geolocationError && (
		// 		<>
		// 			<Text c="dimmed" size="sm">
		// 				<Trans>
		// 					Looks like we can&apos;t grab your location info automatically.
		// 				</Trans>
		// 			</Text>
		// 			<Text c="dimmed" size="sm">
		// 				<Trans>Please enter it manually below.</Trans>
		// 			</Text>
		// 			<TextInput
		// 				mt="md"
		// 				label={<Trans>Latitude</Trans>}
		// 				withAsterisk
		// 				value={input.lat}
		// 				onChange={(e) => {
		// 					handleChange('lat', e.target.value.trim())
		// 				}}
		// 				error={
		// 					/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/.test(input.lat) ||
		// 					input.lat === '' ? undefined : (
		// 						<Trans>Invalid latitude value</Trans>
		// 					)
		// 				}
		// 			/>
		// 			<TextInput
		// 				mt="xs"
		// 				label={<Trans>Longitude</Trans>}
		// 				withAsterisk
		// 				value={input.lon}
		// 				onChange={(e) => {
		// 					handleChange('lon', e.target.value.trim())
		// 				}}
		// 				error={
		// 					/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/.test(
		// 						input.lon,
		// 					) || input.lon === '' ? undefined : (
		// 						<Trans>Invalid longitude value</Trans>
		// 					)
		// 				}
		// 			/>
		// 			<Text
		// 				component="a"
		// 				href="https://support.google.com/maps/answer/18539?hl=en&co=GENIE.Platform%3DDesktop#:~:text=Get%20the%20coordinates,latitude%20and%20longitude."
		// 				target="_blank"
		// 				rel="noopener noreferrer"
		// 				size="sm"
		// 				c="lightblue"
		// 				className="link"
		// 			>
		// 				<Trans>Unsure how to find these? Click here.</Trans>
		// 			</Text>
		// 			<Alert
		// 				className={alertStyles.alert}
		// 				radius="md"
		// 				color="green"
		// 				styles={{
		// 					message: {
		// 						display: 'flex',
		// 						alignItems: 'center',
		// 						gap: '0.75rem',
		// 					},
		// 				}}
		// 				mt="md"
		// 			>
		// 				<IconShieldCheckFilled size={30} strokeWidth={1.5} aria-hidden />
		// 				<span style={{ width: 'calc(100% - 30px - 0.75rem)' }}>
		// 					<Trans>
		// 						Your location data is securely stored exclusively on your
		// 						personal device.
		// 					</Trans>
		// 				</span>
		// 			</Alert>
		// 			<Alert
		// 				className={alertStyles.alert}
		// 				radius="md"
		// 				color="blue"
		// 				styles={{
		// 					message: {
		// 						display: 'flex',
		// 						alignItems: 'center',
		// 						gap: '0.75rem',
		// 						justifyContent: 'flex-start',
		// 					},
		// 				}}
		// 				mt="md"
		// 			>
		// 				<IconInfoCircleFilled size={30} strokeWidth={1.5} aria-hidden />
		// 				<span style={{ width: 'calc(100% - 30px - 0.75rem)' }}>
		// 					<Trans>
		// 						Weather Please collects anonymised crash data and error logs.
		// 						You can opt out of this at any time via the settings menu.
		// 					</Trans>
		// 				</span>
		// 			</Alert>
		// 			<NativeSelect
		// 				mt="xs"
		// 				label={<Trans>Language</Trans>}
		// 				value={input.lang}
		// 				onChange={(e) => {
		// 					handleChange('lang', e.target.value)
		// 				}}
		// 				data={Object.keys(locales).map((key) => ({
		// 					label: locales[key].label,
		// 					value: key,
		// 				}))}
		// 			/>
		// 			<Button
		// 				onClick={() => {
		// 					handleClick('manual')
		// 				}}
		// 				mt="md"
		// 				fullWidth
		// 				disabled={
		// 					!/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/.test(input.lat) ||
		// 					!/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/.test(
		// 						input.lon,
		// 					)
		// 				}
		// 			>
		// 				<Trans>Set my location</Trans>
		// 			</Button>
		// 		</>
		// 	)}
		// </Modal>
		<Dialog
			open={true}
			onClose={() => setIsOpen(false)}
			className="relative z-50"
		>
			<DialogBackdrop className="fixed inset-0 bg-black/60" />
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4">
				<DialogPanel className="max-w-lg space-y-4 rounded-xl border bg-dark-800 p-12">
					<DialogTitle
						as="div"
						className="flex flex-row items-center justify-center gap-5"
					>
						<Image
							priority
							quality={100}
							src={Favicon}
							alt="Weather Please logo"
							style={{ height: '4rem', width: '4rem' }}
						/>
						<h1 className="text-4xl font-bold text-white">
							Weather <span className="text-[#ea5e57]">Please</span>
						</h1>
					</DialogTitle>
					<Description className="mt-8 mb-1 font-semibold text-white">
						<Trans>
							To get started, let&apos;s set your language and location.
						</Trans>
					</Description>
					<p className="text-sm text-dark-100">
						<Trans>
							If your browser prompts you for location permissions, please
							select &quot;allow&quot;.
						</Trans>
					</p>
					<Select
						label="Language"
						value={input.lang}
						onChange={(e) => {
							handleChange('lang', e.target.value)
						}}
						options={Object.keys(locales).map((key) => ({
							value: key,
							label: locales[key].label,
						}))}
					/>
					<Alert icon={IconShieldCheckFilled}>
						<Trans>
							Your location data is securely stored exclusively on your personal
							device.
						</Trans>
					</Alert>
				</DialogPanel>
			</div>
		</Dialog>
	)
}

export default Initialisation
