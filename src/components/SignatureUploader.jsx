import BaseImageUploader from './BaseImageUploader';

export default function SignatureUploader({ value, onChange }) {
  return (
    <BaseImageUploader
      label="Principal Signature"
      value={value}
      onChange={onChange}
    />
  );
}
