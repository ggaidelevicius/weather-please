/* eslint-disable @next/next/no-img-element */
import { ActionIcon, Button, Divider, Modal, Skeleton, Switch, Text, TextInput, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconSettings } from '@tabler/icons-react'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import type { Location } from './types'

const Settings: FC<any> = (props: any) => {
  const { input, handleChange, handleClick, config } = props
  const [opened, { open, close }] = useDisclosure(false)
  const [location, setLocation] = useState<Location>({
    country: '',
    suburb: '',
  })

  useEffect(() => {
    const reverseGeocode = async (): Promise<void> => {
      try {
        const req = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${config.lat}&lon=${config.lon}&format=json`)
        const res = await req.json()
        const { address: { country, suburb } } = res
        setLocation({
          country: country,
          suburb: suburb,
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

  return (
    <>
      <ActionIcon
        aria-label="Open settings"
        title="Open settings"
        variant="light"
        color="dark"
        onClick={open}
        style={{ position: 'fixed', bottom: '1rem', right: '1rem' }}
      >
        <IconSettings aria-hidden />
      </ActionIcon>

      <Modal
        opened={opened}
        onClose={close}
        centered
        size="auto"
        padding="lg"
        radius="md"
        withCloseButton={false}
        sx={{
          maxWidth: '70ch',
        }}
      >
        <Title order={1}>Settings</Title>
        <Title order={2} mt="md">Location</Title>
        <Text mt="xs" sx={{ display: 'flex', alignItems: 'center' }}>
          Based on the provided information, your location is&nbsp;{(!location.country) && <Skeleton width={160} height={21} sx={{ display: 'inline-block' }} aria-label='currently loading' />} {(location.suburb || location.country) && <strong>{location.suburb && `${location.suburb},`} {location.country}.</strong>}
        </Text>
        <Text>
          If this is incorrect, please update the values below.
        </Text>
        <TextInput
          mt="xs"
          label="Latitude"
          withAsterisk
          value={input.lat}
          onChange={(e) => { handleChange('lat', e.target.value.trim()) }}
          error={(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/).test(input.lat) || input.lat === '' ? undefined : 'Invalid latitude value'}
        />
        <TextInput
          mt="xs"
          label="Longitude"
          withAsterisk
          value={input.lon}
          onChange={(e) => { handleChange('lon', e.target.value.trim()) }}
          error={(/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/).test(input.lon) || input.lon === '' ? undefined : 'Invalid longitude value'}
        />
        <Text
          component="a"
          href="https://support.google.com/maps/answer/18539?hl=en&co=GENIE.Platform%3DDesktop#:~:text=Get%20the%20coordinates,latitude%20and%20longitude."
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
          color="lightblue"
          sx={{ '&:hover': { textDecoration: 'underline' } }}
        >
          Unsure how to find these? Click here.
        </Text>
        <Switch
          label="Periodically update location automatically"
          mt="md"
          checked={input.periodicLocationUpdate}
          onChange={(e) => { handleChange('periodicLocationUpdate', e.target.checked) }}
        />
        <Text size="sm" color="dimmed">
          Note: This requires browser permissions
        </Text>
        <Title order={2} mt="xl">Alerts</Title>
        <Switch
          label="Show weather alerts"
          mt="xs"
          checked={input.showAlerts}
          onChange={(e) => { handleChange('showAlerts', e.target.checked) }}
        />
        {input.showAlerts &&
          <>
            <Divider my="md" variant="dashed" />
            <Switch
              label="Show extreme UV alerts"
              mt="md"
              checked={input.showUvAlerts}
              onChange={(e) => { handleChange('showUvAlerts', e.target.checked) }}
            />
            <Switch
              label="Show high precipitation alerts"
              mt="md"
              checked={input.showPrecipitationAlerts}
              onChange={(e) => { handleChange('showPrecipitationAlerts', e.target.checked) }}
            />
            <Switch
              label="Show high wind alerts"
              mt="md"
              checked={input.showWindAlerts}
              onChange={(e) => { handleChange('showWindAlerts', e.target.checked) }}
            />
            <Switch
              label="Show low visibility alerts"
              mt="md"
              checked={input.showVisibilityAlerts}
              onChange={(e) => { handleChange('showVisibilityAlerts', e.target.checked) }}
            />
          </>
        }
        <Title order={2} mt="xl">Miscellaneous</Title>
        <Switch
          label="Use metric number format"
          mt="xs"
          checked={input.useMetric}
          onChange={(e) => { handleChange('useMetric', e.target.checked) }}
        />
        <Button
          onClick={() => { handleClick('manual'); close() }}
          mt="md"
          fullWidth
          disabled={!(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/).test(input.lat) || !(/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/).test(input.lon)}
        >
          Save
        </Button>
        <Divider sx={{ marginTop: '1.75rem', marginBottom: '1.5rem' }} />
        <Text size="sm">
          We&apos;d love to bring Weather Please to more languages.
        </Text>
        <Text size="sm" color="dimmed">
          If you can help by providing translations, please reach out at <Text
            component="a"
            href="mailto:weatherplease.dev@gmail.com"
            color="lightblue"
            sx={{ '&:hover': { textDecoration: 'underline' } }}
          >
            weatherplease.dev@gmail.com
          </Text>
        </Text>
      </Modal>
    </>
  )
}

export default Settings
