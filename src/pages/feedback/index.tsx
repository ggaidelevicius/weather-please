import messages from '@/locales/en/messages'
import { changeLocalisation, locales } from '@/util/i18n'
import { i18n } from '@lingui/core'
import { Trans } from '@lingui/macro'
import {
	Box,
	Button,
	Card,
	Center,
	Checkbox,
	Fieldset,
	NativeSelect,
	SegmentedControl,
	Text,
	TextInput,
	Textarea,
	Title,
	rem,
} from '@mantine/core'
import * as Sentry from '@sentry/nextjs'
import {
	IconAlertCircleFilled,
	IconAt,
	IconCircleCheckFilled,
	IconMessageCircle,
	IconMessageCircleExclamation,
	IconMessageCircleQuestion,
} from '@tabler/icons-react'
import { AnimatePresence, motion } from 'framer-motion'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

if (process.env.NEXT_PUBLIC_BUILD_MODE !== 'extension') {
	i18n.load({
		en: messages,
	})
	i18n.activate('en')

	Sentry.init({
		dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? '',
		tracesSampleRate: 1,
		debug: false,
		replaysOnErrorSampleRate: 1.0,
		replaysSessionSampleRate: 0,
	})
}

const Feedback = () => {
	const router = useRouter()
	const locale =
		typeof router?.query?.locale === 'object'
			? router?.query?.locale[0]
			: router?.query?.locale ?? 'en'
	const type =
		typeof router?.query?.type === 'object'
			? router?.query?.type[0]
			: router?.query?.type ?? 'feedback'
	const installed =
		typeof router?.query?.installed === 'object'
			? router?.query?.installed[0]
			: router?.query?.installed ?? 0
	const [feedbackType, setFeedbackType] = useState(type)
	const [textareaValue, setTextareaValue] = useState<string>('')
	const [emailValue, setEmailValue] = useState<string>('')
	const [reasonsValue, setReasonsValue] = useState<Record<string, boolean>>({
		slowsDownBrowser: false,
		causesCrashes: false,
		missingLanguage: false,
		difficultToUse: false,
		lacksFeatures: false,
		featuresDontWork: false,
		privacyConcerns: false,
		securityConcerns: false,
		noLongerNeed: false,
		foundBetterAlternative: false,
		consumesTooMuchProcessingPower: false,
		consumesTooMuchBattery: false,
		issuesAfterRecentUpdate: false,
	})
	const [loading, setLoading] = useState<boolean>(false)
	const [completed, setCompleted] = useState<boolean>(false)
	const [error, setError] = useState<boolean>(false)
	const [pageLoaded, setPageLoaded] = useState<boolean>(false)

	useEffect(() => {
		changeLocalisation(locale, true)
		setFeedbackType(type)
		setPageLoaded(true)
	}, [locale, type])

	if (process.env.NEXT_PUBLIC_BUILD_MODE === 'extension') {
		return <></>
	}

	const handleClick = async (): Promise<void> => {
		setLoading(true)
		setError(false)
		const data = {
			feedbackType: feedbackType,
			message: textareaValue,
			email: emailValue,
			created: new Date().getTime(),
			locale: locale,
			installed: installed,
			reasons: reasonsValue,
		}
		await fetch('/api/feedback', {
			method: 'POST',
			body: JSON.stringify(data),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.status === 200) {
					setCompleted(true)
				} else {
					setError(true)
				}
			})
		setLoading(false)
	}

	const handleReasonsChange = (k: string, v: boolean): void => {
		setReasonsValue((prev) => ({
			...prev,
			[k]: v,
		}))
	}

	return (
		<>
			<Head>
				<title>Weather Please Feedback</title>
				<meta name="robots" content="noindex" />
			</Head>
			<main style={{ padding: '1rem' }}>
				<AnimatePresence>
					{pageLoaded && (
						<motion.form
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{
								scale: 1,
								opacity: 1,
								transition: {
									type: 'spring',
									duration: 1.5,
									delay: 0.075,
								},
							}}
						>
							{feedbackType === 'uninstall' && (
								<>
									<NativeSelect
										mt="xs"
										label={<Trans>Language</Trans>}
										onChange={(e) => {
											changeLocalisation(e.target.value, true)
										}}
										defaultValue="en"
										data={Object.keys(locales).map((key) => ({
											label: locales[key].label,
											value: key,
										}))}
									/>
									<Title mt="xs" order={1} style={{ maxWidth: 510 }}>
										<Trans>Uninstall feedback</Trans>
									</Title>
									<Text mt="xs" style={{ maxWidth: 510 }}>
										<Trans>
											I would appreciate if you could provide some feedback as
											to why you&apos;ve uninstalled Weather Please. This allows
											me to make Weather Please a better product.
										</Trans>
									</Text>
									<Fieldset mt="xs" legend={<Trans>Performance issues</Trans>}>
										<Checkbox
											disabled={completed}
											mt="xs"
											label={<Trans>Slows down my browser</Trans>}
											checked={reasonsValue.slowsDownBrowser}
											onChange={(e) => {
												handleReasonsChange(
													'slowsDownBrowser',
													e.target.checked,
												)
											}}
										/>
										<Checkbox
											disabled={completed}
											mt="xs"
											label={<Trans>Causes browser crashes or errors</Trans>}
											checked={reasonsValue.causesCrashes}
											onChange={(e) => {
												handleReasonsChange('causesCrashes', e.target.checked)
											}}
										/>
									</Fieldset>
									<Fieldset
										mt="xs"
										legend={<Trans>Usability and functionality</Trans>}
									>
										<Checkbox
											disabled={completed}
											mt="xs"
											label={<Trans>Not available in my language</Trans>}
											checked={reasonsValue.missingLanguage}
											onChange={(e) => {
												handleReasonsChange('missingLanguage', e.target.checked)
											}}
										/>
										<Checkbox
											disabled={completed}
											mt="xs"
											label={<Trans>Difficult to use or understand</Trans>}
											checked={reasonsValue.difficultToUse}
											onChange={(e) => {
												handleReasonsChange('difficultToUse', e.target.checked)
											}}
										/>
										<Checkbox
											disabled={completed}
											mt="xs"
											label={<Trans>Lacks features I need</Trans>}
											checked={reasonsValue.lacksFeatures}
											onChange={(e) => {
												handleReasonsChange('lacksFeatures', e.target.checked)
											}}
										/>
										<Checkbox
											disabled={completed}
											mt="xs"
											label={
												<Trans>Features don&apos;t work as expected</Trans>
											}
											checked={reasonsValue.featuresDontWork}
											onChange={(e) => {
												handleReasonsChange(
													'featuresDontWork',
													e.target.checked,
												)
											}}
										/>
									</Fieldset>
									<Fieldset
										mt="xs"
										legend={<Trans>Security and privacy concerns</Trans>}
									>
										<Checkbox
											disabled={completed}
											mt="xs"
											label={<Trans>Concerned about privacy</Trans>}
											checked={reasonsValue.privacyConcerns}
											onChange={(e) => {
												handleReasonsChange('privacyConcerns', e.target.checked)
											}}
										/>
										<Checkbox
											disabled={completed}
											mt="xs"
											label={<Trans>Concerned about security</Trans>}
											checked={reasonsValue.securityConcerns}
											onChange={(e) => {
												handleReasonsChange(
													'securityConcerns',
													e.target.checked,
												)
											}}
										/>
									</Fieldset>
									<Fieldset mt="xs" legend={<Trans>Changed needs</Trans>}>
										<Checkbox
											disabled={completed}
											mt="xs"
											label={<Trans>No longer need the functionality</Trans>}
											checked={reasonsValue.noLongerNeed}
											onChange={(e) => {
												handleReasonsChange('noLongerNeed', e.target.checked)
											}}
										/>
										<Checkbox
											disabled={completed}
											mt="xs"
											label={<Trans>Found a better alternative</Trans>}
											checked={reasonsValue.foundBetterAlternative}
											onChange={(e) => {
												handleReasonsChange(
													'foundBetterAlternative',
													e.target.checked,
												)
											}}
										/>
									</Fieldset>
									<Fieldset mt="xs" legend={<Trans>Resource usage</Trans>}>
										<Checkbox
											disabled={completed}
											mt="xs"
											label={<Trans>Consumes too much memory or CPU</Trans>}
											checked={reasonsValue.consumesTooMuchProcessingPower}
											onChange={(e) => {
												handleReasonsChange(
													'consumesTooMuchProcessingPower',
													e.target.checked,
												)
											}}
										/>
										<Checkbox
											disabled={completed}
											mt="xs"
											label={<Trans>Too much battery usage</Trans>}
											checked={reasonsValue.consumesTooMuchBattery}
											onChange={(e) => {
												handleReasonsChange(
													'consumesTooMuchBattery',
													e.target.checked,
												)
											}}
										/>
									</Fieldset>
									<Fieldset
										mt="xs"
										legend={<Trans>Update or change related</Trans>}
									>
										<Checkbox
											disabled={completed}
											mt="xs"
											label={<Trans>Issues after a recent update</Trans>}
											checked={reasonsValue.issuesAfterRecentUpdate}
											onChange={(e) => {
												handleReasonsChange(
													'issuesAfterRecentUpdate',
													e.target.checked,
												)
											}}
										/>
									</Fieldset>
									<Textarea
										label={<Trans>Details</Trans>}
										required
										withAsterisk
										autosize
										minRows={4}
										value={textareaValue}
										onChange={(e) => setTextareaValue(e.currentTarget.value)}
										mt="lg"
										disabled={completed}
									/>
									<TextInput
										mt="sm"
										label={<Trans>Email (optional)</Trans>}
										value={emailValue}
										onChange={(e) => setEmailValue(e.currentTarget.value)}
										type="email"
										leftSectionPointerEvents="none"
										leftSection={<IconAt size={16} />}
										disabled={completed}
									/>
									<Button
										mt="lg"
										fullWidth
										disabled={completed || textareaValue === ''}
										onClick={handleClick}
										loading={loading}
									>
										<Trans>Submit</Trans>
									</Button>
								</>
							)}
							{feedbackType !== 'uninstall' && (
								<>
									<SegmentedControl
										value={feedbackType}
										onChange={setFeedbackType}
										disabled={completed}
										data={[
											{
												value: 'feedback',
												label: (
													<Center style={{ padding: '0 1rem' }}>
														<IconMessageCircle
															color="var(--mantine-color-teal-filled)"
															aria-hidden
															style={{ width: rem(32), height: rem(32) }}
														/>
														<Box ml={10}>
															<Trans>Feedback</Trans>
														</Box>
													</Center>
												),
											},
											{
												value: 'feature',
												label: (
													<Center style={{ padding: '0 1rem' }}>
														<IconMessageCircleQuestion
															color="var(--mantine-color-blue-filled)"
															aria-hidden
															style={{ width: rem(32), height: rem(32) }}
														/>
														<Box ml={10}>
															<Trans>Feature request</Trans>
														</Box>
													</Center>
												),
											},
											{
												value: 'bug',
												label: (
													<Center style={{ padding: '0 1rem' }}>
														<IconMessageCircleExclamation
															color="var(--mantine-color-red-filled)"
															aria-hidden
															style={{ width: rem(32), height: rem(32) }}
														/>
														<Box ml={10}>
															<Trans>Bug report</Trans>
														</Box>
													</Center>
												),
											},
										]}
									/>
									<Textarea
										label={<Trans>Message</Trans>}
										withAsterisk
										required
										autosize
										minRows={4}
										value={textareaValue}
										onChange={(e) => setTextareaValue(e.currentTarget.value)}
										mt="lg"
										disabled={completed}
									/>
									<TextInput
										mt="sm"
										label={<Trans>Email (optional)</Trans>}
										value={emailValue}
										onChange={(e) => setEmailValue(e.currentTarget.value)}
										type="email"
										leftSectionPointerEvents="none"
										leftSection={<IconAt size={16} />}
										disabled={completed}
									/>
									<Button
										mt="lg"
										fullWidth
										disabled={textareaValue === '' || completed}
										onClick={handleClick}
										loading={loading}
									>
										<Trans>Submit</Trans>
									</Button>
								</>
							)}
						</motion.form>
					)}
				</AnimatePresence>
				{completed && (
					<Card
						mt="lg"
						style={{
							display: 'flex',
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '0.5rem',
						}}
					>
						<IconCircleCheckFilled size={30} />
						<Text fz="lg" fw="bold">
							<Trans>Feedback successfully submitted</Trans>
						</Text>
					</Card>
				)}
				{error && (
					<Card
						mt="lg"
						style={{
							display: 'flex',
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '0.5rem',
						}}
					>
						<IconAlertCircleFilled size={30} />
						<Text fz="lg" fw="bold">
							<Trans>Error submitting feedback. Try again later.</Trans>
						</Text>
					</Card>
				)}
			</main>
		</>
	)
}

export default Feedback
