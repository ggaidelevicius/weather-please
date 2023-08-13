/* eslint-disable @next/next/no-img-element */
import { ActionIcon, Button, Modal, Text, TextInput, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconSettings } from '@tabler/icons-react'
import styles from './styles.module.css'

const Settings = (props: any) => {
  const { input, handleChange, handleClick } = props
  const [opened, { open, close }] = useDisclosure(false)

  return (
    <>
      <ActionIcon
        className={styles.button}
        aria-label="Open settings"
        title="Open settings"
        variant="light"
        color="dark"
        onClick={open}
      >
        <IconSettings />
      </ActionIcon>

      <Modal
        opened={opened}
        onClose={close}
        centered
        size="auto"
        padding="lg"
        radius="md"
        withCloseButton={false}
      >
        <Title order={1}>Settings</Title>
        <TextInput
          mt="md"
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
          color="blue"
          sx={{ '&:hover': { textDecoration: 'underline' } }}
        >
          Unsure how to find these? Click here.
        </Text>
        <Button
          onClick={() => { handleClick('manual'); close() }}
          mt="md"
          fullWidth
          disabled={!(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/).test(input.lat) || !(/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/).test(input.lon)}
        >
          Save
        </Button>
      </Modal>
    </>
  )
}

export default Settings
