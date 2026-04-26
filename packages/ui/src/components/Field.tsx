import { forwardRef, type ComponentProps } from 'react';
import {
  Select,
  TextInput,
  Textarea,
} from '@mantine/core';

type FieldInputProps = ComponentProps<typeof TextInput>;
type FieldSelectProps = ComponentProps<typeof Select>;
type FieldTextareaProps = ComponentProps<typeof Textarea>;

const fieldClassNames = {
  label: 'chrome-label ui-field-label',
  description: 'ui-field-description',
  error: 'ui-field-error',
  input: 'terminal-input rounded-md ui-field-input',
} as const;

export const FieldInput = forwardRef<HTMLInputElement, FieldInputProps>(
  (props, ref) => <TextInput {...props} ref={ref} classNames={fieldClassNames} />,
);

FieldInput.displayName = 'FieldInput';

export function FieldSelect(props: FieldSelectProps) {
  return (
    <Select
      {...props}
      classNames={{
        ...fieldClassNames,
        dropdown: 'ui-field-dropdown',
        option: 'ui-field-option',
      }}
    />
  );
}

export const FieldTextarea = forwardRef<HTMLTextAreaElement, FieldTextareaProps>(
  (props, ref) => <Textarea {...props} ref={ref} classNames={fieldClassNames} />,
);

FieldTextarea.displayName = 'FieldTextarea';

export type {
  FieldInputProps,
  FieldSelectProps,
  FieldTextareaProps,
};
