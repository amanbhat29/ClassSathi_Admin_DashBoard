import BaseImageUploader from './BaseImageUploader';

export default function FooterUploader({ value, onChange }) {
  return (
    <BaseImageUploader
      label="Custom Footer Image (A4 Width)"
      value={value}
      onChange={onChange}
    />
  );
}
