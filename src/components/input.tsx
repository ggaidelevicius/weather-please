import {
	Description,
	Field,
	Input as HeadlessInput,
	Select as HeadlessSelect,
	Switch as HeadlessSwitch,
	Textarea as HeadlessTextarea,
	Label,
} from '@headlessui/react'
import { Trans } from '@lingui/react/macro'
import { IconChevronDown } from '@tabler/icons-react'
import type {
	ChangeEventHandler,
	ComponentPropsWithoutRef,
	ReactNode,
} from 'react'

interface SelectProps {
	label: ReactNode
	value: string
	options: { value: string; label: ReactNode }[]
	onChange: ChangeEventHandler<HTMLSelectElement>
}

export const Select = ({
	label,
	value,
	onChange,
	options,
}: Readonly<
	Omit<ComponentPropsWithoutRef<'select'>, 'onChange' | 'value'> & SelectProps
>) => (
	<Field>
		<Label className="block text-sm font-medium text-white">{label}</Label>
		<div className="relative mt-2">
			<HeadlessSelect
				className="block w-full appearance-none rounded-sm bg-dark-700 px-3 py-2 text-base text-dark-100 outline-1 -outline-offset-1 outline-dark-400 select-none placeholder:text-dark-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500 sm:text-sm"
				value={value}
				onChange={onChange}
			>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</HeadlessSelect>
			<IconChevronDown
				className="group pointer-events-none absolute top-2.5 right-2.5 size-4 stroke-white/60"
				aria-hidden="true"
			/>
		</div>
	</Field>
)

interface BaseInputProps {
	label: ReactNode
	validation?: boolean
	required?: boolean
}

interface ControlledInputProps extends BaseInputProps {
	value: string
	onChange: ChangeEventHandler<HTMLInputElement>
	name?: undefined
	type?: undefined
}

interface UncontrolledInputProps extends BaseInputProps {
	value?: undefined
	onChange?: undefined
	name: string
	type?: 'email'
}

export const Input = ({
	label,
	value,
	onChange,
	validation,
	name,
	type,
	required,
}: Readonly<ControlledInputProps | UncontrolledInputProps>) => {
	return (
		<Field>
			<Label className="block text-sm font-medium text-white">{label}</Label>
			<HeadlessInput
				className="mt-2 block w-full appearance-none rounded-sm bg-dark-700 px-3 py-2 text-base text-dark-100 outline-1 -outline-offset-1 outline-dark-400 select-none placeholder:text-dark-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500 data-[invalid]:outline-red-500 sm:text-sm"
				value={value}
				onChange={onChange}
				invalid={validation === false}
				name={name}
				type={type}
				required={required}
			/>
			{validation === false && (
				<Description className="mt-2 text-sm text-red-400">
					<Trans>
						Invalid value. Settings will not save until this is valid.
					</Trans>
				</Description>
			)}
		</Field>
	)
}

interface BaseTextareaProps {
	label: ReactNode
	validation?: boolean
}

interface ControlledTextareaProps extends BaseTextareaProps {
	value: string
	onChange: ChangeEventHandler<HTMLTextAreaElement>
	name?: undefined
	required: undefined
}

interface UncontrolledTextareaProps extends BaseTextareaProps {
	value?: undefined
	onChange?: undefined
	name: string
	required?: boolean
}

export const Textarea = ({
	label,
	value,
	onChange,
	validation,
	name,
	required,
}: Readonly<ControlledTextareaProps | UncontrolledTextareaProps>) => {
	return (
		<Field>
			<Label className="block text-sm font-medium text-white">{label}</Label>
			<HeadlessTextarea
				className="mt-2 block w-full resize-none appearance-none rounded-sm bg-dark-700 px-3 py-2 text-base text-dark-100 outline-1 -outline-offset-1 outline-dark-400 select-none placeholder:text-dark-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500 data-[invalid]:outline-red-500 sm:text-sm"
				value={value}
				onChange={onChange}
				invalid={validation === false}
				name={name}
				rows={4}
				required={required}
			/>
			{validation === false && (
				<Description className="mt-2 text-sm text-red-400">
					<Trans>
						Invalid value. Settings will not save until this is valid.
					</Trans>
				</Description>
			)}
		</Field>
	)
}

interface SwitchProps {
	label: ReactNode
	checked: boolean
	onChange: (e: boolean) => void
	description?: string
}

export const Switch = ({
	label,
	checked,
	onChange,
	description,
}: SwitchProps) => {
	return (
		<Field>
			<Label className="block text-sm font-medium text-white">{label}</Label>
			<HeadlessSwitch
				checked={checked}
				onChange={onChange}
				className="group mt-2 inline-flex h-6 w-11 items-center rounded-full bg-dark-500 transition-[background-color] select-none focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 data-[checked]:bg-blue-600"
			>
				<span className="size-4 translate-x-1 rounded-full bg-white transition group-data-[checked]:translate-x-6" />
			</HeadlessSwitch>
			{description && (
				<Description className="mt-1 text-sm text-dark-100">
					{description}
				</Description>
			)}
		</Field>
	)
}
