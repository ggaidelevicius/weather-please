/* eslint-disable @next/next/no-img-element */
import { Button, Modal, Text, TextInput, Title } from '@mantine/core'
import type { FC } from 'react'
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
        <img src='/favicon.png' alt='Weather Please logo' style={{ height: '4rem', width: '4rem' }} />
        <Title order={1}>Weather <span style={{ color: '#ea5e57' }}>Please</span></Title>
      </div>
      <Text sx={{ fontSize: '1.05rem' }}>
        To get started, let&apos;s set your location.
      </Text>
      {!geolocationError &&
        <>
          <Text
            color='dimmed'
            size='sm'
          >
            If your browser prompts you for location permissions, please select &quot;allow&quot;.
          </Text>
          <Button
            onClick={() => { handleClick('auto'); setLoading(true) }}
            mt='md'
            fullWidth
            loading={loading}
          >
            Set my location
          </Button>
        </>
      }
      {geolocationError &&
        <>
          <Text color='dimmed' size='sm'>
            Looks like we can&apos;t grab your location info automatically.
          </Text>
          <Text color='dimmed' size='sm'>
            Please enter it manually below.
          </Text>
          <TextInput
            mt='md'
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
          <Button
            onClick={() => { handleClick('manual') }}
            mt='md'
            fullWidth
            disabled={!(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/).test(input.lat) || !(/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/).test(input.lon)}
          >
            Set my location
          </Button>
        </>
      }
    </Modal>
  )
}

export default Initialisation
