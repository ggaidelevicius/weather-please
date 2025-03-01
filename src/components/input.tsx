import {
	Description,
	Field,
	Input as HeadlessInput,
	Select as HeadlessSelect,
	Switch as HeadlessSwitch,
	Label,
} from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Trans } from '@lingui/react/macro'
import type { ChangeEventHandler, ComponentPropsWithoutRef } from 'react'

interface SelectProps {
	label: string
	value: string
	options: { value: string; label: string }[]
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
				className="block w-full appearance-none rounded-sm bg-dark-700 px-3 py-1.5 text-base text-dark-100 outline-1 -outline-offset-1 outline-dark-400 select-none placeholder:text-dark-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500 sm:text-sm/6"
				aria-label={label}
				value={value}
				onChange={onChange}
			>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</HeadlessSelect>
			<ChevronDownIcon
				className="group pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60"
				aria-hidden="true"
			/>
		</div>
	</Field>
)

interface InputProps {
	label: string
	value: string
	onChange: ChangeEventHandler<HTMLInputElement>
	validation?: boolean
}

export const Input = ({
	label,
	value,
	onChange,
	validation,
}: Readonly<
	Omit<ComponentPropsWithoutRef<'input'>, 'onChange' | 'value'> & InputProps
>) => {
	return (
		<Field>
			<Label className="block text-sm font-medium text-white">{label}</Label>
			<HeadlessInput
				className="mt-2 block w-full appearance-none rounded-sm bg-dark-700 px-3 py-1.5 text-base text-dark-100 outline-1 -outline-offset-1 outline-dark-400 select-none placeholder:text-dark-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500 data-[invalid]:outline-red-500 sm:text-sm/6"
				aria-label={label}
				value={value}
				onChange={onChange}
				invalid={validation === false}
			/>
			{validation === false && (
				<Description className="mt-2 text-sm text-red-400">
					<Trans>Invalid value</Trans>
				</Description>
			)}
		</Field>
	)
}

interface SwitchProps {
	label: string
	checked: boolean
	onChange: (e: boolean) => void
}

export const Switch = ({ label, checked, onChange }: SwitchProps) => {
	return (
		<Field>
			<Label className="block text-sm font-medium text-white">{label}</Label>
			<HeadlessSwitch
				checked={checked}
				onChange={onChange}
				className="group mt-2 inline-flex h-6 w-11 items-center rounded-full bg-dark-500 transition select-none focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 data-[checked]:bg-blue-600"
			>
				<span className="size-4 translate-x-1 rounded-full bg-white transition group-data-[checked]:translate-x-6" />
			</HeadlessSwitch>
		</Field>
	)
}
