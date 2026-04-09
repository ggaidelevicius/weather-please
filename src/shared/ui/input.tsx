import type {
	ChangeEventHandler,
	ComponentPropsWithoutRef,
	ReactNode,
} from 'react'

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
import { clsx } from 'clsx'

type FieldLayout = 'split' | 'stacked'

type FieldLayoutProps = {
	layout?: FieldLayout
}

const getFieldClassName = (layout: FieldLayout = 'stacked') =>
	layout === 'split'
		? 'space-y-2 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-x-6 md:space-y-0'
		: undefined

const getLabelClassName = ({
	layout = 'stacked',
	withControlSpacing = false,
}: Readonly<{
	layout?: FieldLayout
	withControlSpacing?: boolean
}>) =>
	clsx(
		'block text-sm',
		layout === 'split' ? 'font-normal text-dark-100' : 'font-medium text-white',
		layout === 'split' && withControlSpacing ? 'md:pt-2' : undefined,
	)

const getControlWrapperClassName = ({
	controlType,
	layout = 'stacked',
}: Readonly<{
	controlType: 'input' | 'select' | 'switch' | 'textarea'
	layout?: FieldLayout
}>) =>
	clsx(
		layout === 'split' ? 'min-w-0 md:justify-self-end' : undefined,
		layout === 'split' && controlType !== 'switch'
			? 'md:ml-auto md:w-fit md:max-w-full'
			: undefined,
		layout === 'split' && controlType === 'input' ? 'md:w-[20ch]' : undefined,
		layout === 'split' && controlType === 'select' ? 'md:w-[18ch]' : undefined,
		layout === 'split' && controlType === 'textarea'
			? 'md:w-[28rem]'
			: undefined,
		layout === 'split' && controlType === 'switch'
			? 'flex flex-col items-end'
			: undefined,
	)

interface SelectProps {
	label: ReactNode
	onChange: ChangeEventHandler<HTMLSelectElement>
	options: { label: ReactNode; value: string }[]
	value: string
}

export const Select = ({
	label,
	layout,
	onChange,
	options,
	value,
}: Readonly<
	FieldLayoutProps &
		Omit<ComponentPropsWithoutRef<'select'>, 'onChange' | 'value'> &
		SelectProps
>) => (
	<Field className={getFieldClassName(layout)}>
		<Label className={getLabelClassName({ layout, withControlSpacing: true })}>
			{label}
		</Label>
		<div
			className={getControlWrapperClassName({ controlType: 'select', layout })}
		>
			<div className="relative mt-2 md:mt-0">
				<HeadlessSelect
					className="block w-full appearance-none rounded-sm bg-dark-700 px-3 py-2 pr-9 text-right text-base text-dark-100 outline-1 -outline-offset-1 outline-dark-400 select-none placeholder:text-dark-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500 sm:text-sm"
					onChange={onChange}
					value={value}
				>
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</HeadlessSelect>
				<IconChevronDown
					aria-hidden="true"
					className="group pointer-events-none absolute top-2.5 right-2.5 size-4 stroke-white/60"
				/>
			</div>
		</div>
	</Field>
)

interface BaseInputProps {
	label: ReactNode
	layout?: FieldLayout
	required?: boolean
	validation?: boolean
}

interface ControlledInputProps extends BaseInputProps {
	name?: undefined
	onChange: ChangeEventHandler<HTMLInputElement>
	type?: undefined
	value: string
}

interface UncontrolledInputProps extends BaseInputProps {
	name: string
	onChange?: undefined
	type?: 'email'
	value?: undefined
}

export const Input = ({
	label,
	layout,
	name,
	onChange,
	required,
	type,
	validation,
	value,
}: Readonly<ControlledInputProps | UncontrolledInputProps>) => {
	return (
		<Field className={getFieldClassName(layout)}>
			<Label
				className={getLabelClassName({ layout, withControlSpacing: true })}
			>
				{label}
			</Label>
			<div
				className={getControlWrapperClassName({
					controlType: 'input',
					layout,
				})}
			>
				<HeadlessInput
					className="mt-2 block w-full appearance-none rounded-sm bg-dark-700 px-3 py-2 text-right text-base text-dark-100 outline-1 -outline-offset-1 outline-dark-400 select-none placeholder:text-dark-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500 data-invalid:outline-red-500 sm:text-sm md:mt-0"
					invalid={validation === false}
					name={name}
					onChange={onChange}
					required={required}
					type={type}
					value={value}
				/>
				{validation === false && (
					<Description className="mt-2 text-sm text-red-400">
						<Trans>
							Invalid value. Settings will not save until this is valid.
						</Trans>
					</Description>
				)}
			</div>
		</Field>
	)
}

interface BaseTextareaProps {
	label: ReactNode
	layout?: FieldLayout
	validation?: boolean
}

interface ControlledTextareaProps extends BaseTextareaProps {
	name?: undefined
	onChange: ChangeEventHandler<HTMLTextAreaElement>
	required: undefined
	value: string
}

interface UncontrolledTextareaProps extends BaseTextareaProps {
	name: string
	onChange?: undefined
	required?: boolean
	value?: undefined
}

export const Textarea = ({
	label,
	layout,
	name,
	onChange,
	required,
	validation,
	value,
}: Readonly<ControlledTextareaProps | UncontrolledTextareaProps>) => {
	return (
		<Field className={getFieldClassName(layout)}>
			<Label
				className={getLabelClassName({ layout, withControlSpacing: true })}
			>
				{label}
			</Label>
			<div
				className={getControlWrapperClassName({
					controlType: 'textarea',
					layout,
				})}
			>
				<HeadlessTextarea
					className="mt-2 block w-full resize-none appearance-none rounded-sm bg-dark-700 px-3 py-2 text-base text-dark-100 outline-1 -outline-offset-1 outline-dark-400 select-none placeholder:text-dark-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500 data-invalid:outline-red-500 sm:text-sm md:mt-0"
					invalid={validation === false}
					name={name}
					onChange={onChange}
					required={required}
					rows={4}
					value={value}
				/>
				{validation === false && (
					<Description className="mt-2 text-sm text-red-400">
						<Trans>
							Invalid value. Settings will not save until this is valid.
						</Trans>
					</Description>
				)}
			</div>
		</Field>
	)
}

interface SwitchProps {
	checked: boolean
	description?: ReactNode
	label: ReactNode
	labelAccessory?: ReactNode
	layout?: FieldLayout
	onChange: (e: boolean) => void
}

export const Switch = ({
	checked,
	description,
	label,
	labelAccessory,
	layout,
	onChange,
}: Readonly<SwitchProps>) => {
	return (
		<Field className={getFieldClassName(layout)}>
			<Label className={clsx(getLabelClassName({ layout }), 'min-w-0')}>
				{label}
				{labelAccessory ? (
					<span className="ml-1 inline-flex align-middle">
						{labelAccessory}
					</span>
				) : null}
			</Label>
			<div
				className={getControlWrapperClassName({
					controlType: 'switch',
					layout,
				})}
			>
				<HeadlessSwitch
					checked={checked}
					className="group mt-2 inline-flex h-6 w-11 items-center rounded-full bg-dark-500 transition-[background-color] select-none focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 data-checked:bg-blue-600 md:mt-0"
					onChange={onChange}
				>
					<span className="size-4 translate-x-1 rounded-full bg-white transition group-data-checked:translate-x-6" />
				</HeadlessSwitch>
				{description && (
					<Description className="mt-1 text-sm text-dark-100">
						{description}
					</Description>
				)}
			</div>
		</Field>
	)
}
