/* eslint-disable @next/next/no-img-element */
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
          message: 'An error has occurred while fetching your location. Please check the console for more details.',
          color: 'red',
        })
      }
    }
    if (config.lat && config.lon && opened) {
      reverseGeocode()
    }
    return () => { }
  }, [config, opened])

  const generateLocation = (args: Partial<any>): string => {
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
      // pending review
    } else if (userAgent.includes('firefox/')) {
      setReviewLink('https://addons.mozilla.org/en-US/firefox/addon/weather-please/reviews/')
    } else if (userAgent.includes('edg/')) {
      setReviewLink('https://microsoftedge.microsoft.com/addons/detail/weather-please/genbleeffmekfnbkfpgdkdpggamcgflo')
    }

    return () => { }
  }, [])

  return (
    <>
      <ActionIcon
        aria-label='Open settings'
        title='Open settings'
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
        <Title order={1}>Settings</Title>
        <Title order={2} mt='md'>Location</Title>
        <Text mt='xs' sx={{ display: 'flex', flexDirection: 'column' }}>
          Based on the provided information, your location is:{(!location.country) && <Skeleton width={160} height={24.8} sx={{ display: 'inline-block' }} aria-label='currently loading' />} {location.country && <strong>{generateLocation(location)}</strong>}
        </Text>
        <Text mt='xs'>
          If this is incorrect, please update the values below.
        </Text>
        <TextInput
          mt='xs'
          label='Latitude'
          withAsterisk
          value={input.lat}
          onChange={(e) => { handleChange('lat', e.target.value.trim()) }}
          error={(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/).test(input.lat) || input.lat === '' ? undefined : 'Invalid latitude value'}
        />
        <TextInput
          mt='xs'
          label='Longitude'
          withAsterisk
          value={input.lon}
          onChange={(e) => { handleChange('lon', e.target.value.trim()) }}
          error={(/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/).test(input.lon) || input.lon === '' ? undefined : 'Invalid longitude value'}
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
          Unsure how to find these? Click here.
        </Text>
        <Switch
          label='Periodically update location automatically'
          mt='md'
          checked={input.periodicLocationUpdate}
          onChange={(e) => { handleChange('periodicLocationUpdate', e.target.checked) }}
        />
        {!usingSafari &&
          <Text size='sm' color='dimmed'>
            Note: This requires browser permissions
          </Text>
        }
        {usingSafari &&
          <Text size='sm' color='dimmed'>
            Note: This currently does not work well in Safari, and may be inaccurate
          </Text>
        }
        <Title order={2} mt='xl'>Alerts</Title>
        <Switch
          label='Show weather alerts'
          mt='xs'
          checked={input.showAlerts}
          onChange={(e) => { handleChange('showAlerts', e.target.checked) }}
        />
        {input.showAlerts &&
          <>
            <Divider my='md' variant='dashed' />
            <Switch
              label='Show extreme UV alerts'
              mt='md'
              checked={input.showUvAlerts}
              onChange={(e) => { handleChange('showUvAlerts', e.target.checked) }}
            />
            <Switch
              label='Show high precipitation alerts'
              mt='md'
              checked={input.showPrecipitationAlerts}
              onChange={(e) => { handleChange('showPrecipitationAlerts', e.target.checked) }}
            />
            <Switch
              label='Show high wind alerts'
              mt='md'
              checked={input.showWindAlerts}
              onChange={(e) => { handleChange('showWindAlerts', e.target.checked) }}
            />
            <Switch
              label='Show low visibility alerts'
              mt='md'
              checked={input.showVisibilityAlerts}
              onChange={(e) => { handleChange('showVisibilityAlerts', e.target.checked) }}
            />
          </>
        }
        <Title order={2} mt='xl'>Miscellaneous</Title>
        <NativeSelect
          mt='xs'
          label='Number of days to forecast'
          value={input.daysToRetrieve}
          onChange={(e) => { handleChange('daysToRetrieve', e.target.value) }}
          data={['1', '2', '3', '4', '5', '6', '7', '8', '9']}
        />
        <NativeSelect
          mt='xs'
          label='Identifier'
          value={input.identifier}
          onChange={(e) => { handleChange('identifier', e.target.value) }}
          data={[
            { label: 'Day', value: 'day' },
            { label: 'Date', value: 'date' },
          ]}
        />
        <Switch
          label='Use metric number format'
          mt='md'
          checked={input.useMetric}
          onChange={(e) => { handleChange('useMetric', e.target.checked) }}
        />
        <Button
          onClick={() => { handleClick('manual'); close() }}
          mt='md'
          fullWidth
          disabled={!(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/).test(input.lat) || !(/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/).test(input.lon)}
        >
          Save
        </Button>
        <Divider sx={{ marginTop: '1.75rem', marginBottom: '1.5rem' }} />
        <Text size='sm'>
          We&apos;d love to bring Weather Please to more languages.
        </Text>
        <Text size='sm' color='dimmed'>
          If you can help by providing translations, please reach out at <Text
            component='a'
            href='mailto:weatherplease.dev@gmail.com'
            color='lightblue'
            sx={{ '&:hover': { textDecoration: 'underline' } }}
          >
            weatherplease.dev@gmail.com
          </Text>
        </Text>
        <Divider sx={{ marginTop: '0.875rem', marginBottom: '0.75rem' }} variant='dashed' />
        <Text size='sm' color='lightblue' component='a' href={reviewLink} sx={{ '&:hover': { textDecoration: 'underline' } }} target='_blank'>
          🌟 Leave a review
        </Text>
        <Text size='sm' color='lightblue' component='a' href='https://github.com/ggaidelevicius/weather-please/issues' sx={{ marginTop: '0.2rem', '&:hover': { textDecoration: 'underline' } }} target='_blank'>
          🐛 Report a bug
        </Text>
        {/* <Text size='sm' component='a' href='https://www.buymeacoffee.com/ggaidelevicius' sx={{ '&:hover': { textDecoration: 'underline' } }} target='_blank'>
          ☕ Buy me a coffee
        </Text> */}
      </Modal>
    </>
  )
}

export default Settings
