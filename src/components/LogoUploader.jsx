import BaseImageUploader from './BaseImageUploader';

export default function LogoUploader({ value, onChange }) {
  return (
    <BaseImageUploader
      label="School Logo"
      value={value}
      onChange={onChange}
    />
  );
}
