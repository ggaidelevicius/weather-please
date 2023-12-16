import { locales } from '@/util/i18n'
import { Trans } from '@lingui/macro'
import {
	ActionIcon,
	Alert,
	Button,
	Divider,
	Modal,
	NativeSelect,
	Skeleton,
	Switch,
	Text,
	TextInput,
	Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import * as Sentry from '@sentry/nextjs'
import { IconSettings, IconShieldCheckFilled } from '@tabler/icons-react'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import alertStyles from '../alert/styles.module.css'
import type { HandleOutsideClick, Location, SettingsProps } from './types'

const Settings: FC<SettingsProps> = (props) => {
	const {
		input,
		handleChange,
		handleClick,
		config,
		setInput,
		usingSafari,
		reviewLink,
	} = props
	const [opened, { open, close }] = useDisclosure(false)
	const [outsideClickModalOpened, setOutsideClickModalOpened] =
		useState<boolean>(false)
	const [location, setLocation] = useState<Location>({
		suburb: null,
		cityDistrict: null,
		borough: null,
		village: null,
		town: null,
		city: null,
		municipality: null,
		district: null,
		stateDistrict: null,
		county: null,
		state: null,
		territory: null,
		subdivision: null,
		region: null,
		country: null,
		continent: null,
	})

	useEffect(() => {
		const reverseGeocode = async (): Promise<void> => {
			try {
				const req = await fetch(
					`https://nominatim.openstreetmap.org/reverse?lat=${config.lat}&lon=${config.lon}&format=json`,
				)
				const res = await req.json()
				const {
					address: {
						suburb,
						city_district,
						borough,
						village,
						town,
						city,
						municipality,
						district,
						state_district,
						county,
						state,
						territory,
						subdivision,
						region,
						country,
						continent,
					},
				} = res
				setLocation({
					suburb: suburb,
					cityDistrict: city_district,
					borough: borough,
					village: village,
					town: town,
					city: city,
					municipality: municipality,
					district: district,
					stateDistrict: state_district,
					county: county,
					state: state,
					territory: territory,
					subdivision: subdivision,
					region: region,
					country: country,
					continent: continent,
				})
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error(e)
				notifications.show({
					title: <Trans>Error</Trans>,
					message: (
						<Trans>
							An error has occurred while fetching your location. Please check
							the console for more details.
						</Trans>
					),
					color: 'red',
				})
				if (config.shareCrashesAndErrors) {
					Sentry.captureException(e)
				}
			}
		}
		if (config.lat && config.lon && opened) {
			reverseGeocode()
		}
	}, [config.lat, config.lon, opened, config.shareCrashesAndErrors])

	const handleOutsideClick: HandleOutsideClick = () => {
		if (JSON.stringify(config) !== JSON.stringify(input)) {
			if (!outsideClickModalOpened) {
				setOutsideClickModalOpened(true)
			}
		} else {
			close()
		}
	}

	return (
		<>
			<ActionIcon
				aria-label="Open settings"
				title="Open settings" // how do i pass translated values into here?
				variant="light"
				color="gray"
				onClick={open}
				style={{ position: 'fixed', bottom: '1rem', right: '1rem' }}
			>
				<IconSettings aria-hidden style={{ width: '70%', height: '70%' }} />
			</ActionIcon>

			<Modal
				opened={opened}
				onClose={handleOutsideClick} // instead of invoking this directly we should first check to see if there are unsaved changes
				centered
				size="auto"
				padding="lg"
				radius="md"
				withCloseButton={false}
				style={{
					maxWidth: '70ch',
				}}
				styles={{
					body: {
						display: 'flex',
						flexDirection: 'column',
					},
				}}
			>
				<Title order={1}>
					<Trans>Settings</Trans>
				</Title>
				<Title order={2} mt="md">
					<Trans>Location</Trans>
				</Title>
				<Text mt="xs" style={{ display: 'flex', flexDirection: 'column' }}>
					<Trans>Based on the provided information, your location is:</Trans>
					{!location.country && (
						<Skeleton
							width={160}
							height={24.8}
							style={{ display: 'inline-block' }}
							aria-label="currently loading"
						/>
					)}{' '}
					{location.country && <strong>{generateLocation(location)}</strong>}
				</Text>
				<Text mt="xs">
					<Trans>If this is incorrect, please update the values below.</Trans>
				</Text>
				<TextInput
					mt="xs"
					label={<Trans>Latitude</Trans>}
					withAsterisk
					value={input.lat}
					onChange={(e) => {
						handleChange('lat', e.target.value.trim())
					}}
					error={
						/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/.test(input.lat) ||
						input.lat === '' ? undefined : (
							<Trans>Invalid latitude value</Trans>
						)
					}
				/>
				<TextInput
					mt="xs"
					label={<Trans>Longitude</Trans>}
					withAsterisk
					value={input.lon}
					onChange={(e) => {
						handleChange('lon', e.target.value.trim())
					}}
					error={
						/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/.test(
							input.lon,
						) || input.lon === '' ? undefined : (
							<Trans>Invalid longitude value</Trans>
						)
					}
				/>
				<Text
					component="a"
					href="https://support.google.com/maps/answer/18539?hl=en&co=GENIE.Platform%3DDesktop#:~:text=Get%20the%20coordinates,latitude%20and%20longitude."
					target="_blank"
					rel="noopener noreferrer"
					size="sm"
					c="lightblue"
					className="link"
				>
					<Trans>Unsure how to find these? Click here.</Trans>
				</Text>
				<Switch
					label={<Trans>Periodically update location automatically</Trans>}
					mt="md"
					checked={input.periodicLocationUpdate}
					onChange={(e) => {
						handleChange('periodicLocationUpdate', e.target.checked)
					}}
				/>
				{!usingSafari && (
					<Text size="sm" c="dimmed">
						<Trans>Note: This requires browser permissions</Trans>
					</Text>
				)}
				{usingSafari && (
					<Text size="sm" c="dimmed">
						<Trans>
							Note: This currently does not work well in Safari, and may be
							inaccurate
						</Trans>
					</Text>
				)}
				<Alert
					className={alertStyles.alert}
					radius="md"
					color="green"
					styles={{
						message: {
							display: 'flex',
							alignItems: 'center',
							gap: '0.75rem',
						},
					}}
					mt="md"
				>
					<IconShieldCheckFilled size={30} strokeWidth={1.5} aria-hidden />
					<span style={{ width: 'calc(100% - 30px - 0.75rem)' }}>
						<Trans>
							Your location data is securely stored exclusively on your personal
							device
						</Trans>
					</span>
				</Alert>
				<Title order={2} mt="xl">
					<Trans>Tiles</Trans>
				</Title>
				<NativeSelect
					mt="xs"
					label={<Trans>Number of days to forecast</Trans>}
					value={input.daysToRetrieve}
					onChange={(e) => {
						handleChange('daysToRetrieve', e.target.value)
					}}
					data={['1', '2', '3', '4', '5', '6', '7', '8', '9']}
				/>
				<NativeSelect
					mt="xs"
					label={<Trans>Identifier</Trans>}
					value={input.identifier}
					onChange={(e) => {
						handleChange('identifier', e.target.value)
					}}
					data={[
						{ label: (<Trans>Day</Trans>) as unknown as string, value: 'day' },
						{
							label: (<Trans>Date</Trans>) as unknown as string,
							value: 'date',
						},
					]}
				/>
				<Title order={2} mt="xl">
					<Trans>Alerts</Trans>
				</Title>
				<Switch
					label={<Trans>Show weather alerts</Trans>}
					mt="xs"
					checked={input.showAlerts}
					onChange={(e) => {
						handleChange('showAlerts', e.target.checked)
					}}
				/>
				{input.showAlerts && (
					<>
						<Divider my="md" variant="dashed" />
						<Switch
							label={<Trans>Show extreme UV alerts</Trans>}
							checked={input.showUvAlerts}
							onChange={(e) => {
								handleChange('showUvAlerts', e.target.checked)
							}}
						/>
						<Switch
							label={<Trans>Show high precipitation alerts</Trans>}
							mt="md"
							checked={input.showPrecipitationAlerts}
							onChange={(e) => {
								handleChange('showPrecipitationAlerts', e.target.checked)
							}}
						/>
						<Switch
							label={<Trans>Show strong wind alerts</Trans>}
							mt="md"
							checked={input.showWindAlerts}
							onChange={(e) => {
								handleChange('showWindAlerts', e.target.checked)
							}}
						/>
						<Switch
							label={<Trans>Show low visibility alerts</Trans>}
							mt="md"
							checked={input.showVisibilityAlerts}
							onChange={(e) => {
								handleChange('showVisibilityAlerts', e.target.checked)
							}}
						/>
					</>
				)}
				<Title order={2} mt="xl">
					<Trans>Miscellaneous</Trans>
				</Title>
				<NativeSelect
					mt="xs"
					label={<Trans>Language</Trans>}
					value={input.lang}
					onChange={(e) => {
						handleChange('lang', e.target.value)
					}}
					data={Object.keys(locales).map((key) => ({
						label: locales[key].label,
						value: key,
					}))}
				/>
				<Switch
					label={<Trans>Use metric number format</Trans>}
					mt="md"
					checked={input.useMetric}
					onChange={(e) => {
						handleChange('useMetric', e.target.checked)
					}}
				/>
				<Switch
					label={<Trans>Share anonymised crash data and error logs</Trans>}
					mt="md"
					checked={input.shareCrashesAndErrors}
					onChange={(e) => {
						handleChange('shareCrashesAndErrors', e.target.checked)
					}}
				/>
				<Button
					onClick={() => {
						handleClick('manual')
						close()
					}}
					mt="md"
					fullWidth
					disabled={
						!/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/.test(input.lat) ||
						!/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/.test(
							input.lon,
						)
					}
				>
					<Trans>Save</Trans>
				</Button>
				<Button
					onClick={() => {
						setInput(config)
						close()
					}}
					mt="xs"
					fullWidth
					color="red"
					variant="light"
				>
					<Trans>Cancel</Trans>
				</Button>
				<Text size="sm" mt="md">
					<Trans>
						I&apos;d love to bring Weather Please to more languages.
					</Trans>
				</Text>
				<Text size="sm" c="dimmed">
					<Trans>
						If you have a translation request, please reach out at{' '}
						<Text
							component="a"
							href="mailto:contact@weather-please.app"
							c="lightblue"
							className="link"
						>
							contact@weather-please.app
						</Text>
					</Trans>
				</Text>
				<Divider
					style={{ marginTop: '0.875rem', marginBottom: '0.75rem' }}
					variant="dashed"
				/>
				<Text
					size="sm"
					c="lightblue"
					component="a"
					href={reviewLink}
					className="link"
					target="_blank"
				>
					<Trans>🌟 Leave a review</Trans>
				</Text>
				<Text
					size="sm"
					c="lightblue"
					component="a"
					href={`https://weather-please.app/feedback?type=feedback&locale=${input.lang}`}
					style={{ marginTop: '0.2rem' }}
					className="link"
					target="_blank"
				>
					<Trans>✍️ Submit feedback</Trans>
				</Text>
				<Text
					size="sm"
					c="lightblue"
					component="a"
					href={`https://weather-please.app/feedback?type=feature&locale=${input.lang}`}
					style={{ marginTop: '0.2rem' }}
					className="link"
					target="_blank"
				>
					<Trans>💡 Request a feature</Trans>
				</Text>
				<Text
					size="sm"
					c="lightblue"
					component="a"
					href={`https://weather-please.app/feedback?type=bug&locale=${input.lang}`}
					style={{ marginTop: '0.2rem' }}
					className="link"
					target="_blank"
				>
					<Trans>🐛 Report a bug</Trans>
				</Text>
				<Text
					size="sm"
					c="lightblue"
					component="a"
					href={locales[input.lang].privacy}
					style={{ marginTop: '0.2rem' }}
					className="link"
					target="_blank"
				>
					<Trans>🔒 Privacy policy</Trans>
				</Text>
				{!usingSafari && (
					<Text
						size="sm"
						c="lightblue"
						component="a"
						href="https://www.buymeacoffee.com/ggaidelevicius"
						style={{ marginTop: '0.2rem' }}
						className="link"
						target="_blank"
					>
						<Trans>☕ Gift a coffee</Trans>
					</Text>
				)}
			</Modal>

			<Modal
				opened={outsideClickModalOpened}
				onClose={handleOutsideClick} // instead of invoking this directly we should first check to see if there are unsaved changes
				centered
				size="auto"
				padding="lg"
				radius="md"
				withCloseButton={false}
				style={{
					maxWidth: '70ch',
				}}
				styles={{
					body: {
						display: 'flex',
						flexDirection: 'column',
					},
				}}
				overlayProps={{ blur: 5 }}
			>
				<Title order={1}>
					<Trans>You have unsaved changes</Trans>
				</Title>
				{(!/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/.test(input.lat) ||
					!/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/.test(
						input.lon,
					)) && ( // this should instead prompt the user to cancel this modal only, or alternatively put the inputs back in here
					<Text mt="md">
						<Trans>
							You can&apos;t save because either your latitude or longitude are
							invalid.
						</Trans>
					</Text>
				)}
				<Button
					onClick={() => {
						handleClick('manual')
						setOutsideClickModalOpened(false)
						close()
					}}
					mt="md"
					fullWidth
					disabled={
						!/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/.test(input.lat) ||
						!/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/.test(
							input.lon,
						)
					}
				>
					<Trans>Save</Trans>
				</Button>
				<Button
					onClick={() => {
						setInput(config)
						setOutsideClickModalOpened(false)
						close()
					}}
					mt="xs"
					fullWidth
					color="red"
					variant="light"
				>
					<Trans>Don&apos;t save</Trans>
				</Button>
			</Modal>
		</>
	)
}

const generateLocation = (args: Location): string => {
	let specificLocation =
		args?.suburb ??
		args?.cityDistrict ??
		args?.borough ??
		args?.village ??
		args?.town ??
		args?.city ??
		args?.municipality ??
		args?.district ??
		args?.stateDistrict ??
		args?.county ??
		null
	if (specificLocation) {
		specificLocation = `${specificLocation}, `
	}
	const broadLocation =
		args?.state ??
		args?.territory ??
		args?.subdivision ??
		args?.region ??
		args?.country ??
		args?.continent ??
		'Unknown'

	return specificLocation
		? `${specificLocation}${broadLocation}`
		: broadLocation
}

export default Settings
