/* eslint-disable @next/next/no-img-element */
import { Trans } from '@lingui/macro'
import { ActionIcon, Button, Divider, Modal, NativeSelect, Skeleton, Switch, Text, TextInput, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconSettings } from '@tabler/icons-react'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import type { Location, SettingsProps } from './types'

const Settings: FC<SettingsProps> = (props) => {
  const { input, handleChange, handleClick, config } = props
  const [opened, { open, close }] = useDisclosure(false)
  const [usingSafari, setUsingSafari] = useState<boolean>(false)
  const [reviewLink, setReviewLink] = useState('https://chrome.google.com/webstore/detail/weather-please/pgpheojdhgdjjahjpacijmgenmegnchn/reviews')
  const [location, setLocation] = useState<Location>({
    country: '',
    town: '',
    suburb: '',
    village: '',
  })

  useEffect(() => {
    const reverseGeocode = async (): Promise<void> => {
      try {
        const req = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${config.lat}&lon=${config.lon}&format=json`)
        const res = await req.json()
        const { address: { country, suburb, town, village, state, county } } = res
        setLocation({
          country: country,
          suburb: suburb,
          town: town,
          village: village,
          state: state,
          county: county,
        })
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e)
        notifications.show({
          title: 'Error',
          message: <Trans>An error has occurred while fetching your location. Please check the console for more details.</Trans>,
          color: 'red',
        })
      }
    }
    if (config.lat && config.lon && opened) {
      reverseGeocode()
    }
  }, [config.lat, config.lon, opened])

  const generateLocation = (args: Record<keyof any, any>): string => {
    let specificLocation = args?.village ?? args?.town ?? args?.suburb ?? args?.county ?? null
    if (specificLocation) {
      specificLocation = `${specificLocation}, `
    }
    const broadLocation = args?.state ?? args.country

    return specificLocation ? `${specificLocation}${broadLocation}` : broadLocation
  }

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()

    if (userAgent.indexOf('safari') !== -1 && userAgent.indexOf('chrome') === -1) {
      setUsingSafari(true)
      setReviewLink('https://apps.apple.com/au/app/weather-please/id6462968576')
    } else if (userAgent.includes('firefox/')) {
      setReviewLink('https://addons.mozilla.org/en-US/firefox/addon/weather-please/reviews/')
    } else if (userAgent.includes('edg/')) {
      setReviewLink('https://microsoftedge.microsoft.com/addons/detail/weather-please/genbleeffmekfnbkfpgdkdpggamcgflo')
    }
  }, [])

  return (
    <>
      <ActionIcon
        aria-label={<Trans>Open settings</Trans> as unknown as string}
        title={<Trans>Open settings</Trans> as unknown as string}
        variant='light'
        color='dark'
        onClick={open}
        style={{ position: 'fixed', bottom: '1rem', right: '1rem' }}
      >
        <IconSettings aria-hidden />
      </ActionIcon>

      <Modal
        opened={opened}
        onClose={close}
        centered
        size='auto'
        padding='lg'
        radius='md'
        withCloseButton={false}
        sx={{
          maxWidth: '70ch',
        }}
        styles={{
          body: {
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Title order={1}><Trans>Settings</Trans></Title>
        <Title order={2} mt='md'><Trans>Location</Trans></Title>
        <Text mt='xs' sx={{ display: 'flex', flexDirection: 'column' }}>
          <Trans>Based on the provided information, your location is:</Trans>{(!location.country) && <Skeleton width={160} height={24.8} sx={{ display: 'inline-block' }} aria-label='currently loading' />} {location.country && <strong>{generateLocation(location)}</strong>}
        </Text>
        <Text mt='xs'>
          <Trans>If this is incorrect, please update the values below.</Trans>
        </Text>
        <TextInput
          mt='xs'
          label={<Trans>Latitude</Trans>}
          withAsterisk
          value={input.lat}
          onChange={(e) => { handleChange('lat', e.target.value.trim()) }}
          error={(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/).test(input.lat) || input.lat === '' ? undefined : <Trans>Invalid latitude value</Trans>}
        />
        <TextInput
          mt='xs'
          label={<Trans>Longitude</Trans>}
          withAsterisk
          value={input.lon}
          onChange={(e) => { handleChange('lon', e.target.value.trim()) }}
          error={(/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/).test(input.lon) || input.lon === '' ? undefined : <Trans>Invalid longitude value</Trans>}
        />
        <Text
          component='a'
          href='https://support.google.com/maps/answer/18539?hl=en&co=GENIE.Platform%3DDesktop#:~:text=Get%20the%20coordinates,latitude%20and%20longitude.'
          target='_blank'
          rel='noopener noreferrer'
          size='sm'
          color='lightblue'
          sx={{ '&:hover': { textDecoration: 'underline' } }}
        >
          <Trans>Unsure how to find these? Click here.</Trans>
        </Text>
        <Switch
          label={<Trans>Periodically update location automatically</Trans>}
          mt='md'
          checked={input.periodicLocationUpdate}
          onChange={(e) => { handleChange('periodicLocationUpdate', e.target.checked) }}
        />
        {!usingSafari &&
          <Text size='sm' color='dimmed'>
            <Trans>Note: This requires browser permissions</Trans>
          </Text>
        }
        {usingSafari &&
          <Text size='sm' color='dimmed'>
            <Trans>Note: This currently does not work well in Safari, and may be inaccurate</Trans>
          </Text>
        }
        <Title order={2} mt='xl'><Trans>Tiles</Trans></Title>
        <NativeSelect
          mt='xs'
          label={<Trans>Number of days to forecast</Trans>}
          value={input.daysToRetrieve}
          onChange={(e) => { handleChange('daysToRetrieve', e.target.value) }}
          data={['1', '2', '3', '4', '5', '6', '7', '8', '9']}
        />
        <NativeSelect
          mt='xs'
          label={<Trans>Identifier</Trans>}
          value={input.identifier}
          onChange={(e) => { handleChange('identifier', e.target.value) }}
          data={[
            { label: <Trans>Day</Trans> as unknown as string, value: 'day' },
            { label: <Trans>Date</Trans> as unknown as string, value: 'date' },
          ]}
        />
        <Title order={2} mt='xl'><Trans>Alerts</Trans></Title>
        <Switch
          label={<Trans>Show weather alerts</Trans>}
          mt='xs'
          checked={input.showAlerts}
          onChange={(e) => { handleChange('showAlerts', e.target.checked) }}
        />
        {input.showAlerts &&
          <>
            <Divider my='md' variant='dashed' />
            <Switch
              label={<Trans>Show extreme UV alerts</Trans>}
              checked={input.showUvAlerts}
              onChange={(e) => { handleChange('showUvAlerts', e.target.checked) }}
            />
            <Switch
              label={<Trans>Show high precipitation alerts</Trans>}
              mt='md'
              checked={input.showPrecipitationAlerts}
              onChange={(e) => { handleChange('showPrecipitationAlerts', e.target.checked) }}
            />
            <Switch
              label={<Trans>Show high wind alerts</Trans>}
              mt='md'
              checked={input.showWindAlerts}
              onChange={(e) => { handleChange('showWindAlerts', e.target.checked) }}
            />
            <Switch
              label={<Trans>Show low visibility alerts</Trans>}
              mt='md'
              checked={input.showVisibilityAlerts}
              onChange={(e) => { handleChange('showVisibilityAlerts', e.target.checked) }}
            />
          </>
        }
        <Title order={2} mt='xl'><Trans>Miscellaneous</Trans></Title>
        <NativeSelect
          mt='xs'
          label={<Trans>Language</Trans>}
          value={input.lang}
          onChange={(e) => { handleChange('lang', e.target.value) }}
          data={[
            { label: 'English', value: 'en' },
            { label: 'Lithuanian', value: 'lt' },
            { label: 'Tiếng Việt', value: 'vi' },
          ]}
        />
        <Switch
          label={<Trans>Use metric number format</Trans>}
          mt='md'
          checked={input.useMetric}
          onChange={(e) => { handleChange('useMetric', e.target.checked) }}
        />
        <Switch
          label={<Trans>Share anonymised crash data and error logs</Trans>}
          mt='md'
          checked={input.shareCrashesAndErrors}
          onChange={(e) => { handleChange('shareCrashesAndErrors', e.target.checked) }}
        />
        <Button
          onClick={() => { handleClick('manual'); close() }}
          mt='md'
          fullWidth
          disabled={!(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/).test(input.lat) || !(/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/).test(input.lon)}
        >
          <Trans>Save</Trans>
        </Button>
        <Divider sx={{ marginTop: '1.75rem', marginBottom: '1.5rem' }} />
        <Text size='sm'>
          <Trans>We&apos;d love to bring Weather Please to more languages.</Trans>
        </Text>
        <Text size='sm' color='dimmed'>
          <Trans>
            If you can help by providing translations, please reach out at <Text
              component='a'
              href='mailto:contact@weather-please.app'
              color='lightblue'
              sx={{ '&:hover': { textDecoration: 'underline' } }}
            >
              contact@weather-please.app
            </Text>
          </Trans>
        </Text>
        <Divider sx={{ marginTop: '0.875rem', marginBottom: '0.75rem' }} variant='dashed' />
        <Text size='sm' color='lightblue' component='a' href={reviewLink} sx={{ '&:hover': { textDecoration: 'underline' } }} target='_blank'>
          <Trans>🌟 Leave a review</Trans>
        </Text>
        <Text size='sm' color='lightblue' component='a' href='https://github.com/ggaidelevicius/weather-please/issues' sx={{ marginTop: '0.2rem', '&:hover': { textDecoration: 'underline' } }} target='_blank'>
          <Trans>🐛 Report a bug</Trans>
        </Text>
        <Text size='sm' color='lightblue' component='a' href='https://github.com/ggaidelevicius/weather-please/blob/main/PRIVACY.md' sx={{ marginTop: '0.2rem', '&:hover': { textDecoration: 'underline' } }} target='_blank'>
          <Trans>🔒 Privacy policy</Trans>
        </Text>
        {/* <Text size='sm' color='lightblue' component='a' href='https://www.buymeacoffee.com/ggaidelevicius' sx={{ marginTop: '0.2rem', '&:hover': { textDecoration: 'underline' } }} target='_blank'>
          <Trans>☕ Gift me a coffee</Trans>
        </Text> */}
      </Modal>
    </>
  )
}

export default Settings
