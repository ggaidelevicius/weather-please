import messages from '@/locales/en/messages'
import { changeLocalisation } from '@/util/i18n'
import { i18n } from '@lingui/core'
import { Trans } from '@lingui/macro'
import {
	Box,
	Button,
	Card,
	Center,
	SegmentedControl,
	Text,
	TextInput,
	Textarea,
	rem,
} from '@mantine/core'
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

i18n.load({
	en: messages,
})
i18n.activate('en')

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
	const [feedbackType, setFeedbackType] = useState(type)
	const [textareaValue, setTextareaValue] = useState<string>('')
	const [emailValue, setEmailValue] = useState<string>('')
	const [loading, setLoading] = useState<boolean>(false)
	const [completed, setCompleted] = useState<boolean>(false)
	const [error, setError] = useState<boolean>(false)
	const [pageLoaded, setPageLoaded] = useState<boolean>(false)

	useEffect(() => {
		changeLocalisation(locale)
		setFeedbackType(type)
		setPageLoaded(true)
	}, [locale, type])

	const handleClick = async (): Promise<void> => {
		setLoading(true)
		setError(false)
		const data = {
			feedbackType: feedbackType,
			message: textareaValue,
			email: emailValue,
			created: new Date().getTime(),
			locale: locale,
		}
		await fetch('/api/feedback', {
			method: 'POST',
			body: JSON.stringify(data),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.code === 200) setCompleted(true)
				if (data.code === 400 || data.code === 500) setError(true)
			})
		setLoading(false)
	}

	if (process.env.NEXT_PUBLIC_DEMO === 'true') {
		return (
			<>
				<Head>
					<title>Weather Please Feedback</title>
					<meta name="robots" content="noindex" />
				</Head>
				<main>
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
	return <></>
}

export default Feedback
