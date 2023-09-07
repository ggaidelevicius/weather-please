/* eslint-disable @next/next/no-img-element */
import { Trans } from '@lingui/macro'
import { Button, Modal, NativeSelect, Text, TextInput, Title } from '@mantine/core'
import Image from 'next/image'
import type { FC } from 'react'
import Favicon from '../../../public/favicon.png'
import type { InitialisationProps } from './types'

const Initialisation: FC<InitialisationProps> = (props) => {
  const {
    opened,
    geolocationError,
    handleClick,
    setLoading,
    loading,
    input,
    handleChange,
    close,
  } = props

  return (
    <Modal
      opened={opened}
      onClose={close}
      centered
      size='auto'
      padding='lg'
      radius='md'
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      trapFocus={false}
    >
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '2rem', justifyContent: 'center' }}>
        <Image priority quality={100} src={Favicon} alt='Weather Please logo' style={{ height: '4rem', width: '4rem' }} />
        <Title order={1}>Weather <span style={{ color: '#ea5e57' }}>Please</span></Title>
      </div>
      <Text sx={{ fontSize: '1.05rem' }}>
        <Trans>To get started, let&apos;s set your language and location.</Trans>
      </Text>
      {!geolocationError &&
        <>
          <Text
            color='dimmed'
            size='sm'
          >
            <Trans>If your browser prompts you for location permissions, please select &quot;allow&quot;.</Trans>
          </Text>
          <NativeSelect
            mt='xs'
            label={<Trans>Language</Trans>}
            value={input.lang}
            onChange={(e) => { handleChange('lang', e.target.value) }}
            data={[
              { label: 'English', value: 'en' },
              { label: 'Lietuvių', value: 'lt' },
              { label: 'Tiếng Việt', value: 'vi' },
            ]}
          />
          <Button
            onClick={() => { handleClick('auto'); setLoading(true) }}
            mt='md'
            fullWidth
            loading={loading}
          >
            <Trans>Set my location</Trans>
          </Button>
        </>
      }
      {geolocationError &&
        <>
          <Text color='dimmed' size='sm'>
            <Trans>Looks like we can&apos;t grab your location info automatically.</Trans>
          </Text>
          <Text color='dimmed' size='sm'>
            <Trans>Please enter it manually below.</Trans>
          </Text>
          <TextInput
            mt='md'
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
          <NativeSelect
            mt='xs'
            label={<Trans>Language</Trans>}
            value={input.lang}
            onChange={(e) => { handleChange('lang', e.target.value) }}
            data={[
              { label: 'English', value: 'en' },
              { label: 'Lietuvių', value: 'lt' },
              { label: 'Tiếng Việt', value: 'vi' },
            ]}
          />
          <Button
            onClick={() => { handleClick('manual') }}
            mt='md'
            fullWidth
            disabled={!(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/).test(input.lat) || !(/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/).test(input.lon)}
          >
            <Trans>Set my location</Trans>
          </Button>
        </>
      }
    </Modal>
  )
}

export default Initialisation
